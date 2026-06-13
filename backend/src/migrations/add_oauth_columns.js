const pool = require('../config/db');

async function addOAuthColumns() {
  try {
    // Separate statements — some Postgres drivers reject multi-statement DDL
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS discord_id VARCHAR(50) UNIQUE`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id  VARCHAR(50) UNIQUE`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS oauth_provider VARCHAR(20)`);
    // Allow OAuth-only accounts to have no password
    await pool.query(`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`);
    console.log('[migration] OAuth columns ready ✓');
  } catch (err) {
    console.error('[migration] add_oauth_columns failed:', err.message);
    throw err;
  }
}

module.exports = addOAuthColumns;
