const express = require('express');
const multer  = require('multer');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const { uploadToR2 } = require('../utils/uploadToR2');

const router = express.Router();

// ── Multer config ──────────────────────────────────────────────
const bugUpload = multer({
  storage:    multer.memoryStorage(),
  limits:     { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only images are allowed.'));
  },
});

// ── POST /api/bugs ─────────────────────────────────────────────
router.post('/', auth, bugUpload.single('image'), async (req, res) => {
  try {
    const { title, description, page_url, user_agent } = req.body;

    if (!title?.trim())       return res.status(400).json({ error: 'Title is required.' });
    if (!description?.trim()) return res.status(400).json({ error: 'Description is required.' });

    const imageUrl = req.file
      ? await uploadToR2(req.file.buffer, 'bugs', req.file.originalname)
      : null;

    const result = await pool.query(
      `INSERT INTO bug_reports (user_id, title, description, image_url, page_url, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [req.user.id, title.trim(), description.trim(), imageUrl, page_url || null, user_agent || null]
    );

    res.status(201).json({ id: result.rows[0].id, message: 'Bug report submitted.' });
  } catch (err) {
    console.error('Bug report error:', err);
    res.status(500).json({ error: 'Failed to submit bug report.' });
  }
});

module.exports = router;
