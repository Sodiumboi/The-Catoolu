const pool = require('../config/db');

module.exports = async function createNotes() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS notes (
      id                   SERIAL PRIMARY KEY,
      uuid                 VARCHAR(36) NOT NULL UNIQUE DEFAULT gen_random_uuid()::VARCHAR,
      user_id              INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title                VARCHAR(200) NOT NULL DEFAULT 'Untitled Note',
      body                 TEXT NOT NULL DEFAULT '',
      tag                  VARCHAR(200),
      tag_type             VARCHAR(20),
      last_cursor_position INTEGER DEFAULT 0,
      created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_notes_user_id ON notes(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_notes_uuid    ON notes(uuid)`);
};
