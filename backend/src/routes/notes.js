const express = require('express');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');

const router = express.Router();

// GET /api/notes — list all notes for current user (no body field)
router.get('/', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, uuid, title, tag, tag_type, updated_at
       FROM notes WHERE user_id = $1 ORDER BY updated_at DESC`,
      [req.user.id]
    );
    res.json({ notes: result.rows });
  } catch (err) {
    console.error('Notes list error:', err);
    res.status(500).json({ error: 'Failed to fetch notes.' });
  }
});

// POST /api/notes — create new note
router.post('/', auth, async (req, res) => {
  try {
    const { title = 'Untitled Note', tag, tag_type } = req.body;
    const result = await pool.query(
      `INSERT INTO notes (user_id, title, tag, tag_type)
       VALUES ($1, $2, $3, $4)
       RETURNING id, uuid, title, body, tag, tag_type, updated_at`,
      [req.user.id, title, tag || null, tag_type || null]
    );
    res.status(201).json({ note: result.rows[0] });
  } catch (err) {
    console.error('Notes create error:', err);
    res.status(500).json({ error: 'Failed to create note.' });
  }
});

// GET /api/notes/:uuid — get single note with body
router.get('/:uuid', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, uuid, title, body, tag, tag_type, last_cursor_position, updated_at
       FROM notes WHERE uuid = $1 AND user_id = $2`,
      [req.params.uuid, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Note not found.' });
    res.json({ note: result.rows[0] });
  } catch (err) {
    console.error('Notes get error:', err);
    res.status(500).json({ error: 'Failed to fetch note.' });
  }
});

// PUT /api/notes/:uuid — update note
router.put('/:uuid', auth, async (req, res) => {
  try {
    const { title, body, last_cursor_position, client_updated_at } = req.body;

    if (client_updated_at) {
      const check = await pool.query(
        `SELECT updated_at FROM notes WHERE uuid = $1 AND user_id = $2`,
        [req.params.uuid, req.user.id]
      );
      if (!check.rows.length) return res.status(404).json({ error: 'Note not found.' });
      if (new Date(check.rows[0].updated_at) > new Date(client_updated_at)) {
        return res.status(409).json({ error: 'Note was updated in another session.' });
      }
    }

    const result = await pool.query(
      `UPDATE notes
       SET title                = COALESCE($1, title),
           body                 = COALESCE($2, body),
           last_cursor_position = COALESCE($3, last_cursor_position),
           updated_at           = NOW()
       WHERE uuid = $4 AND user_id = $5
       RETURNING id, uuid, title, tag, tag_type, updated_at`,
      [title ?? null, body ?? null, last_cursor_position ?? null, req.params.uuid, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Note not found.' });
    res.json({ note: result.rows[0] });
  } catch (err) {
    console.error('Notes update error:', err);
    res.status(500).json({ error: 'Failed to update note.' });
  }
});

// DELETE /api/notes/:uuid
router.delete('/:uuid', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM notes WHERE uuid = $1 AND user_id = $2 RETURNING id`,
      [req.params.uuid, req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: 'Note not found.' });
    res.status(204).send();
  } catch (err) {
    console.error('Notes delete error:', err);
    res.status(500).json({ error: 'Failed to delete note.' });
  }
});

module.exports = router;
