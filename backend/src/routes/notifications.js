const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const auth    = require('../middleware/auth');

router.use(auth);

// ── GET /api/notifications ────────────────────────────────────
// Fetch all notifications for the current user, newest first.
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY is_pinned DESC, created_at DESC
       LIMIT 50`,
      [req.user.id]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ error: 'Failed to load notifications.' });
  }
});

// ── PUT /api/notifications/read-all ──────────────────────────
// Mark all non-pinned notifications as read.
router.put('/read-all', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'All marked as read.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as read.' });
  }
});

// ── DELETE /api/notifications ─────────────────────────────────
// Clear all non-pinned notifications.
router.delete('/', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM notifications WHERE user_id = $1 AND is_pinned = false',
      [req.user.id]
    );
    res.json({ message: 'Cleared.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to clear notifications.' });
  }
});

// ── DELETE /api/notifications/:id ────────────────────────────
// Dismiss a single notification.
router.delete('/:id', async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Dismissed.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to dismiss.' });
  }
});

module.exports = router;