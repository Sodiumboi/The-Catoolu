// ============================================================
// Profile Routes (all protected)
// GET  /api/profile      ← get current user's profile
// PUT  /api/profile      ← update username or email
// PUT  /api/profile/password ← change password (requires current)
// ============================================================

const express = require('express');
const bcrypt  = require('bcryptjs');
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');

// ── Multer config ─────────────────────────────────────────────
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../../uploads/avatars');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, req.user.id + '.jpg');
  },
});

const avatarUpload = multer({
  storage: avatarStorage,
  limits:  { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, and WebP images are allowed.'));
    }
  },
});

const router = express.Router();
router.use(auth);

// ── GET /api/profile ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, avatar_url, created_at FROM users WHERE id = $1',
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

// ── POST /api/profile/avatar ──────────────────────────────────
router.post('/avatar', avatarUpload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded.' });
    }

    const avatarUrl = '/uploads/avatars/' + req.user.id + '.jpg';

    await pool.query(
      'UPDATE users SET avatar_url = $1 WHERE id = $2',
      [avatarUrl, req.user.id]
    );

    res.json({ avatar_url: avatarUrl });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 2MB.' });
    }
    console.error('Avatar upload error:', err);
    res.status(500).json({ error: err.message || 'Failed to upload avatar.' });
  }
});

module.exports = router;