const pool = require('../config/db');

module.exports = async function addSessionLuckEnabled() {
  try {
    await pool.query(
      `ALTER TABLE campaigns
       ADD COLUMN IF NOT EXISTS session_luck_enabled BOOLEAN NOT NULL DEFAULT false`
    );
    console.log('[migration] session_luck_enabled column ready ✓');
  } catch (err) {
    console.error('[migration] add_session_luck_enabled failed:', err.message);
    throw err;
  }
};
