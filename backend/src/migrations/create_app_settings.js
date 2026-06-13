const pool = require('../config/db');

module.exports = async function createAppSettings() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS app_settings (
        key        VARCHAR(100) PRIMARY KEY,
        value      TEXT NOT NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);
    await pool.query(`
      INSERT INTO app_settings (key, value) VALUES ('maintenance_mode', 'false')
      ON CONFLICT (key) DO NOTHING
    `);
    await pool.query(`
      INSERT INTO app_settings (key, value)
      VALUES ('maintenance_message', 'The Catoolu will be going down for maintenance shortly.')
      ON CONFLICT (key) DO NOTHING
    `);
    console.log('[migration] app_settings ready ✓');
  } catch (err) {
    console.error('[migration] create_app_settings failed:', err.message);
    throw err;
  }
};
