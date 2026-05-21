// ============================================================
// Character Routes (all protected — require valid JWT)
//
// GET    /api/characters        ← list all your characters
// POST   /api/characters        ← create a new character
// GET    /api/characters/:id    ← get one character's full data
// PUT    /api/characters/:id    ← update/save a character
// DELETE /api/characters/:id    ← delete a character
// ============================================================

const express = require('express');
const crypto  = require('crypto');
const pool    = require('../config/db');
const auth    = require('../middleware/auth');

const router = express.Router();

// All routes here require authentication — apply middleware to the whole router
router.use(auth);

// ── GET /api/characters ────────────────────────────────────
// Returns a lightweight list (no full JSON blob) for the dashboard
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
  `SELECT
     id, name, occupation, game_type, created_at, updated_at,
     sheet_data->'Investigator'->'Characteristics'->>'Sanity'  AS sanity,
     sheet_data->'Investigator'->'Characteristics'->>'HitPts'  AS hp,
     portrait_data
   FROM characters
   WHERE user_id = $1
   ORDER BY updated_at DESC`,
  [req.user.id]
);

    res.json({ characters: result.rows });

  } catch (err) {
    console.error('List characters error:', err);
    res.status(500).json({ error: 'Failed to fetch characters.' });
  }
});

// ── POST /api/characters ───────────────────────────────────
// Creates a new character from imported JSON or blank template
router.post('/', async (req, res) => {
  try {
    const { sheet_data } = req.body;

    if (!sheet_data) {
      return res.status(400).json({ error: 'sheet_data is required.' });
    }

    // Extract top-level fields for quick-access columns
    const name       = sheet_data?.Investigator?.PersonalDetails?.Name       || 'Unknown Investigator';
    const occupation = sheet_data?.Investigator?.PersonalDetails?.Occupation || '';
    const game_type  = sheet_data?.Investigator?.Header?.GameType            || 'Classic (1920\'s)';

    // Store portrait separately to keep the main JSON lean
    const portrait_data = sheet_data?.Investigator?.PersonalDetails?.Portrait || null;

    // Remove portrait from the JSON we store (it's stored separately)
    const cleanSheet = JSON.parse(JSON.stringify(sheet_data));
    if (cleanSheet?.Investigator?.PersonalDetails?.Portrait) {
      delete cleanSheet.Investigator.PersonalDetails.Portrait;
    }

    // Inject UUID into the sheet on first import
    if (cleanSheet?.Investigator?.Header) {
      cleanSheet.Investigator.Header.UUID = crypto.randomUUID();
    }

    const result = await pool.query(
      `INSERT INTO characters (user_id, name, occupation, game_type, sheet_data, portrait_data)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, occupation, game_type, created_at`,
      [req.user.id, name, occupation, game_type, cleanSheet, portrait_data]
    );

    res.status(201).json({
      message:   'Character created!',
      character: result.rows[0]
    });

  } catch (err) {
    console.error('Create character error:', err);
    res.status(500).json({ error: 'Failed to create character.' });
  }
});

// ── GET /api/characters/:id ────────────────────────────────
// Returns the FULL character data including portrait
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, occupation, game_type, sheet_data, portrait_data, created_at, updated_at
       FROM characters
       WHERE id = $1 AND user_id = $2`,
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    const character = result.rows[0];

    // Re-attach portrait into the sheet_data for the response
    if (character.portrait_data) {
      character.sheet_data.Investigator.PersonalDetails.Portrait = character.portrait_data;
    }

    res.json({ character });

  } catch (err) {
    console.error('Get character error:', err);
    res.status(500).json({ error: 'Failed to fetch character.' });
  }
});

// ── PUT /api/characters/:id ────────────────────────────────
// Save edits to an existing character
router.put('/:id', async (req, res) => {
  try {
    const { sheet_data } = req.body;

    if (!sheet_data) {
      return res.status(400).json({ error: 'sheet_data is required.' });
    }

    // Verify the character belongs to this user before updating
    const ownerCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    const name       = sheet_data?.Investigator?.PersonalDetails?.Name       || 'Unknown Investigator';
    const occupation = sheet_data?.Investigator?.PersonalDetails?.Occupation || '';
    const game_type  = sheet_data?.Investigator?.Header?.GameType            || 'Classic (1920\'s)';

    const portrait_data = sheet_data?.Investigator?.PersonalDetails?.Portrait || null;

    const cleanSheet = JSON.parse(JSON.stringify(sheet_data));
    if (cleanSheet?.Investigator?.PersonalDetails?.Portrait) {
      delete cleanSheet.Investigator.PersonalDetails.Portrait;
    }

    const result = await pool.query(
      `UPDATE characters
       SET name = $1, occupation = $2, game_type = $3,
           sheet_data = $4, portrait_data = $5
       WHERE id = $6 AND user_id = $7
       RETURNING id, name, occupation, updated_at`,
      [name, occupation, game_type, cleanSheet, portrait_data, req.params.id, req.user.id]
    );

    res.json({
      message:   'Character saved!',
      character: result.rows[0]
    });

  } catch (err) {
    console.error('Update character error:', err);
    res.status(500).json({ error: 'Failed to save character.' });
  }
});

// ── DELETE /api/characters/:id ─────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM characters WHERE id = $1 AND user_id = $2 RETURNING id, name',
      [req.params.id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    res.json({
      message:   `Character "${result.rows[0].name}" deleted.`,
      deletedId: result.rows[0].id
    });

  } catch (err) {
    console.error('Delete character error:', err);
    res.status(500).json({ error: 'Failed to delete character.' });
  }
});

// ── PUT /api/characters/:id/notes ─────────────────────────
// Save session notes separately — quick endpoint so notes
// don't require sending the full sheet_data
router.put('/:id/notes', async (req, res) => {
  try {
    const { notes } = req.body;

    if (notes === undefined) {
      return res.status(400).json({ error: 'notes field is required.' });
    }

    // Verify ownership
    const ownerCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    // Update just the Notes key inside the JSONB sheet_data
    // jsonb_set lets us update a nested key without touching the rest
    await pool.query(
      `UPDATE characters
       SET sheet_data = jsonb_set(
         sheet_data,
         '{Investigator,Notes}',
         $1::jsonb
       )
       WHERE id = $2 AND user_id = $3`,
      [JSON.stringify(notes), req.params.id, req.user.id]
    );

    res.json({ message: 'Notes saved!' });

  } catch (err) {
    console.error('Save notes error:', err);
    res.status(500).json({ error: 'Failed to save notes.' });
  }
});

// ── PUT /api/characters/:id/stat ─────────────────────────────
// Update a single tracked stat (HP, MP, Luck, Sanity current value)
router.put('/:id/stat', async (req, res) => {
  try {
    const { stat, value } = req.body;

    const allowed = ['HitPts', 'MagicPts', 'Luck', 'Sanity'];
    if (!allowed.includes(stat)) {
      return res.status(400).json({ error: 'Invalid stat.' });
    }

    const ownerCheck = await pool.query(
      'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Character not found.' });
    }

    await pool.query(
      `UPDATE characters
       SET sheet_data = jsonb_set(
         sheet_data,
         '{Investigator,Characteristics,' || $1 || '}',
         to_jsonb($2::text)
       )
       WHERE id = $3 AND user_id = $4`,
      [stat, String(value), req.params.id, req.user.id]
    );

    res.json({ message: 'Stat updated.' });
  } catch (err) {
    console.error('Stat update error:', err);
    res.status(500).json({ error: 'Failed to update stat.' });
  }
});

module.exports = router;
