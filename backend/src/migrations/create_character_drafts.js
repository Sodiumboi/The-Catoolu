const db = require('../config/db');

// Creates the character_drafts table that backs the creation-wizard "resume"
// feature — one in-progress draft per user (UNIQUE(user_id)).
async function createCharacterDrafts() {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS character_drafts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        wizard_state JSONB NOT NULL,
        current_step INTEGER NOT NULL DEFAULT 1,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE(user_id)
      )
    `);
    console.log('[migration] character_drafts table ready ✓');
  } catch (err) {
    console.error('[migration] character_drafts migration failed:', err.message);
    throw err;
  }
}

module.exports = createCharacterDrafts;
