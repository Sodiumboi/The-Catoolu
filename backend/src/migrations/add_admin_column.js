const pool = require('../config/db');

module.exports = async function addAdminColumn() {
  try {
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE`);
    console.log('[migration] is_admin column ready ✓');
  } catch (err) {
    console.error('[migration] add_admin_column failed:', err.message);
    throw err;
  }
};
