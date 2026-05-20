// ── UUID on import — add this to POST /api/characters ─────
//
// In backend/src/routes/characters.js find the POST / route.
// It currently looks like this:
//
//   router.post('/', async (req, res) => {
//     try {
//       const { sheet_data } = req.body;
//       ...
//       const result = await pool.query(
//         'INSERT INTO characters (user_id, sheet_data) VALUES ($1, $2) RETURNING *',
//         [req.user.id, sheet_data]
//       );
//
// Add UUID injection BEFORE the INSERT query:

// ── PATCH: add these lines just before the pool.query INSERT ──

// Generate a UUID and inject it into the sheet before saving.
// We store it at sheet_data.Investigator.Header.UUID so it
// travels with the character on export/import — same location
// Dhole's House uses for CharacterUID.
if (sheet_data?.Investigator?.Header) {
  sheet_data.Investigator.Header.UUID = crypto.randomUUID();
}

// That's the only change. The INSERT query stays the same.
// crypto.randomUUID() is built into Node.js 19+ — no npm install needed.
// If your Node version is older, use:
//   const { v4: uuidv4 } = require('uuid');   // npm install uuid
//   sheet_data.Investigator.Header.UUID = uuidv4();

// ── FULL updated POST / route for reference ───────────────

/*
router.post('/', async (req, res) => {
  try {
    const { sheet_data } = req.body;

    if (!sheet_data || !sheet_data.Investigator) {
      return res.status(400).json({ error: 'Invalid character data.' });
    }

    // Inject UUID into the sheet on first import
    if (sheet_data?.Investigator?.Header) {
      sheet_data.Investigator.Header.UUID = crypto.randomUUID();
    }

    const result = await pool.query(
      'INSERT INTO characters (user_id, sheet_data) VALUES ($1, $2) RETURNING *',
      [req.user.id, JSON.stringify(sheet_data)]
    );

    res.status(201).json({ character: result.rows[0] });
  } catch (err) {
    console.error('Create character error:', err);
    res.status(500).json({ error: 'Failed to save character.' });
  }
});
*/

// ── Where the UUID lives in the JSON ──────────────────────
//
// After import, the character JSON looks like:
// {
//   "Investigator": {
//     "Header": {
//       "UUID": "a3f8c2d1-4b5e-6f7a-8b9c-0d1e2f3a4b5c",  ← new
//       "Name": "Kurt Weber",
//       "GameType": "Classic (1920's)",
//       ...
//     },
//     ...
//   }
// }
//
// This UUID:
// - Is generated once on import, never changes
// - Survives export/import cycles (it's inside the JSON)
// - Is compatible with Dhole's House CharacterUID format
// - Does NOT change the database schema (stored inside JSONB)
// - Can be used in v1.5 to identify characters across campaigns
