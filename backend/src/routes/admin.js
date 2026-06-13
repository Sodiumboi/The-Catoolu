const express   = require('express');
const path      = require('path');
const fs        = require('fs');
const multer    = require('multer');
const pool      = require('../config/db');
const auth      = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const { uploadToR2 } = require('../utils/uploadToR2');

const router = express.Router();

// All admin routes require authentication + admin flag
router.use(auth, adminOnly);

const teamUpload = multer({
  storage:    multer.memoryStorage(),
  limits:     { fileSize: 4 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    cb(null, allowed.includes(file.mimetype));
  },
});

// ── POST /api/admin/team-upload ────────────────────────────────
router.post('/team-upload', teamUpload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded.' });
  try {
    const url = await uploadToR2(req.file.buffer, 'team', req.file.originalname);
    res.json({ url });
  } catch (err) {
    console.error('Team upload error:', err);
    res.status(500).json({ error: 'Upload failed.' });
  }
});

// ── GET /api/admin/bugs ────────────────────────────────────────
router.get('/bugs', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT br.id, br.title, br.description, br.image_url, br.page_url,
             br.user_agent, br.status, br.created_at,
             u.username
      FROM bug_reports br
      LEFT JOIN users u ON u.id = br.user_id
      ORDER BY br.created_at DESC
    `);
    res.json({ bugs: result.rows });
  } catch (err) {
    console.error('Admin bugs list error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── PATCH /api/admin/bugs/:id ──────────────────────────────────
router.patch('/bugs/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ['open', 'resolved'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    const result = await pool.query(
      'UPDATE bug_reports SET status = $1 WHERE id = $2 RETURNING id, status',
      [status, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found.' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Admin bug patch error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── DELETE /api/admin/bugs/:id ─────────────────────────────────
router.delete('/bugs/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM bug_reports WHERE id = $1 RETURNING image_url',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found.' });

    // Delete the uploaded image file if present
    const imageUrl = result.rows[0].image_url;
    if (imageUrl) {
      const filePath = path.join(__dirname, '../../', imageUrl);
      fs.unlink(filePath, () => {}); // fail silently
    }

    res.json({ message: 'Deleted.' });
  } catch (err) {
    console.error('Admin bug delete error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/admin/maintenance ─────────────────────────────────
router.get('/maintenance', async (req, res) => {
  try {
    const [modeRow, msgRow] = await Promise.all([
      pool.query("SELECT value FROM app_settings WHERE key = 'maintenance_mode'"),
      pool.query("SELECT value FROM app_settings WHERE key = 'maintenance_message'"),
    ]);
    res.json({
      maintenance: modeRow.rows[0]?.value === 'true',
      message:     msgRow.rows[0]?.value  || '',
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/admin/maintenance ────────────────────────────────
router.post('/maintenance', async (req, res) => {
  try {
    const { enabled, message } = req.body;
    const io = req.app.get('io');

    await pool.query(
      `UPDATE app_settings SET value = $1, updated_at = NOW() WHERE key = 'maintenance_mode'`,
      [enabled ? 'true' : 'false']
    );
    if (message !== undefined) {
      await pool.query(
        `UPDATE app_settings SET value = $1, updated_at = NOW() WHERE key = 'maintenance_message'`,
        [message]
      );
    }

    const msgRow     = await pool.query("SELECT value FROM app_settings WHERE key = 'maintenance_message'");
    const finalMsg   = msgRow.rows[0]?.value || 'The Catoolu will be going down for maintenance shortly.';

    if (enabled) {
      io.emit('maintenance:warning',   { message: finalMsg });
    } else {
      io.emit('maintenance:cancelled');
    }

    res.json({ maintenance: !!enabled, message: finalMsg });
  } catch (err) {
    console.error('Maintenance toggle error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── GET /api/admin/stats ───────────────────────────────────────
router.get('/stats', async (req, res) => {
  try {
    const [users, characters, campaigns, bugs] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query('SELECT COUNT(*) FROM characters'),
      pool.query('SELECT COUNT(*) FROM campaigns'),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'open')     AS open,
          COUNT(*) FILTER (WHERE status = 'resolved') AS resolved
        FROM bug_reports
      `),
    ]);
    res.json({
      total_users:      parseInt(users.rows[0].count),
      total_characters: parseInt(characters.rows[0].count),
      total_campaigns:  parseInt(campaigns.rows[0].count),
      bugs_open:        parseInt(bugs.rows[0].open),
      bugs_resolved:    parseInt(bugs.rows[0].resolved),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
