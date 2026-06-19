// ============================================================
// Profile Routes (all protected)
// GET  /api/profile      ← get current user's profile
// PUT  /api/profile      ← update username or email
// PUT  /api/profile/password ← change password (requires current)
// ============================================================

const express = require('express');
const bcrypt  = require('bcryptjs');
const multer  = require('multer');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const { uploadToR2, deleteFromR2 }    = require('../utils/uploadToR2');
const quota = require('../utils/uploadQuota');

function bytesToMb(b) { return Math.round((b / (1024 * 1024)) * 10) / 10; }

// ── Multer config ─────────────────────────────────────────────
const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'));
    }
  },
});

const router = express.Router();
router.use(auth);

// ── GET /api/profile ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, avatar_url, created_at,
              discord_id, google_id,
              (password IS NOT NULL) AS has_password
       FROM users WHERE id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: result.rows[0] });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── PUT /api/profile ───────────────────────────────────────
// Update username and/or email
router.put('/', async (req, res) => {
  try {
    const { username, email } = req.body;

    if (!username && !email) {
      return res.status(400).json({ error: 'Provide username or email to update.' });
    }

    if (username && (username.length < 3 || username.length > 50)) {
      return res.status(400).json({ error: 'Username must be 3–50 characters.' });
    }

    // Check for conflicts with other users
    if (username || email) {
      const conflict = await pool.query(
        `SELECT id FROM users
         WHERE (username = $1 OR email = $2) AND id != $3`,
        [username || '', (email || '').toLowerCase(), req.user.id]
      );
      if (conflict.rows.length > 0) {
        return res.status(409).json({ error: 'That username or email is already taken.' });
      }
    }

    // Build dynamic UPDATE — only update fields that were provided
    const updates = [];
    const values  = [];
    let   idx     = 1;

    if (username) { updates.push(`username = $${idx++}`); values.push(username); }
    if (email)    { updates.push(`email = $${idx++}`);    values.push(email.toLowerCase()); }

    values.push(req.user.id);

    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${idx} RETURNING id, username, email`,
      values
    );

    res.json({
      message: 'Profile updated!',
      user:    result.rows[0],
    });

  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── PUT /api/profile/password ──────────────────────────────
// Change password — requires current password for verification
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new password are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters.' });
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({ error: 'New password must be different from current.' });
    }

    // Get current hashed password
    const result = await pool.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.id]
    );
    const user = result.rows[0];

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect.' });
    }

    // Hash and save new password
    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashed, req.user.id]
    );

    res.json({ message: 'Password changed successfully!' });

  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/profile/upload-quota ────────────────────────────
router.get('/upload-quota', async (req, res) => {
  try {
    await quota.reconcile(req.user.id);   // back-fill any untracked files first
    res.json(await quota.getQuota(req.user.id));
  } catch (err) {
    console.error('upload-quota error:', err);
    res.status(500).json({ error: 'Failed to fetch upload quota.' });
  }
});

// ── POST /api/profile/avatar ──────────────────────────────────
router.post('/avatar', avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    // Storage + rate quota (file size is known now that multer parsed it)
    const check = await quota.canUpload(req.user.id, req.file.size);
    if (!check.ok) {
      const msg = check.reason === 'total'
        ? `Storage full — you've used ${bytesToMb(check.quota.totalUsed)}MB of ${bytesToMb(check.quota.totalLimit)}MB. Delete files to free space.`
        : `Upload rate limit reached (${bytesToMb(check.quota.windowLimit)}MB per 5 min). Try again shortly.`;
      return res.status(429).json({ error: msg });
    }

    // Delete old avatar from R2 if it was stored there, and stop tracking it
    const existing = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [req.user.id]);
    const oldUrl = existing.rows[0]?.avatar_url;
    if (oldUrl && oldUrl.startsWith(process.env.R2_PUBLIC_URL)) {
      await deleteFromR2(oldUrl).catch(() => {});
      await quota.untrackByUrl(oldUrl);
    }

    const avatarUrl = await uploadToR2(req.file.buffer, 'avatars', req.file.originalname);

    await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2',
      [avatarUrl, req.user.id]
    );
    await quota.recordUpload(req.user.id, { url: avatarUrl, size: req.file.size, kind: 'avatar' });

    res.json({ avatar_url: avatarUrl });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 15MB.' });
    }
    console.error('Avatar upload error:', err);
    const isStorageError = err.message?.toLowerCase().includes('credential') ||
                           err.name?.toLowerCase().includes('credential') ||
                           err.$metadata?.httpStatusCode === 403;
    res.status(500).json({
      error: isStorageError ? 'File storage is unavailable. Contact the administrator.' : 'Failed to upload avatar.',
    });
  }
});

// ── GET /api/profile/uploads ──────────────────────────────────
// List the current user's tracked files (newest first) for file management.
router.get('/uploads', async (req, res) => {
  try {
    await quota.reconcile(req.user.id, { prune: true }); // sync with source tables
    const result = await pool.query(
      `SELECT u.id, u.url, u.size_bytes, u.kind, u.campaign_id, u.created_at,
              c.name  AS campaign_name,
              h.title AS handout_title,
              b.title AS bug_title
       FROM user_uploads u
       LEFT JOIN campaigns   c ON c.id = u.campaign_id
       LEFT JOIN handouts    h ON h.content   = u.url
       LEFT JOIN bug_reports b ON b.image_url = u.url
       WHERE u.user_id = $1
       ORDER BY u.created_at DESC`,
      [req.user.id]
    );
    const nameFor = (r) =>
      r.kind === 'handout' ? (r.handout_title || 'Handout image')
      : r.kind === 'bug'   ? (r.bug_title ? 'Bug: ' + r.bug_title : 'Bug screenshot')
      :                      'Avatar';
    const files = result.rows.map(r => ({
      id:            r.id,
      url:           r.url,
      name:          nameFor(r),
      sizeBytes:     Number(r.size_bytes),
      kind:          r.kind,
      campaignId:    r.campaign_id,
      campaignName:  r.campaign_name,
      createdAt:     r.created_at,
    }));
    res.json({ files, quota: await quota.getQuota(req.user.id) });
  } catch (err) {
    console.error('list uploads error:', err);
    res.status(500).json({ error: 'Failed to list files.' });
  }
});

// ── DELETE /api/profile/uploads/:id ───────────────────────────
// Delete a tracked file: remove from R2, clear the owning reference, untrack.
router.delete('/uploads/:id', async (req, res) => {
  try {
    const row = await pool.query(
      'SELECT * FROM user_uploads WHERE id = $1',
      [req.params.id]
    );
    if (!row.rows.length)              return res.status(404).json({ error: 'File not found.' });
    if (row.rows[0].user_id !== req.user.id) return res.status(403).json({ error: 'Not your file.' });

    const { url, kind } = row.rows[0];

    // Remove the object from R2 (ignore if already gone)
    await deleteFromR2(url).catch(() => {});

    // Clear the reference that points at this file so nothing shows a dead link
    if (kind === 'avatar') {
      await pool.query(
        'UPDATE users SET avatar_url = NULL WHERE id = $1 AND avatar_url = $2',
        [req.user.id, url]
      );
    } else if (kind === 'bug') {
      await pool.query('UPDATE bug_reports SET image_url = NULL WHERE image_url = $1', [url]);
    } else if (kind === 'handout') {
      // An image handout *is* the file — remove the handout and its links/shares
      const h = await pool.query('SELECT id FROM handouts WHERE content = $1', [url]);
      if (h.rows.length) {
        const hid = h.rows[0].id;
        await pool.query('DELETE FROM handout_bundle_items WHERE item_id = $1 OR bundle_id = $1', [hid]);
        await pool.query('DELETE FROM handout_shares WHERE handout_id = $1', [hid]);
        await pool.query('DELETE FROM handouts WHERE id = $1', [hid]);
      }
    }

    await pool.query('DELETE FROM user_uploads WHERE id = $1', [row.rows[0].id]);

    res.json({ ok: true, quota: await quota.getQuota(req.user.id) });
  } catch (err) {
    console.error('delete upload error:', err);
    res.status(500).json({ error: 'Failed to delete file.' });
  }
});

module.exports = router;