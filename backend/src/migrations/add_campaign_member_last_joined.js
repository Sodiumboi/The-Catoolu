const pool = require('../config/db');

module.exports = async function addCampaignMemberLastJoined() {
  try {
    await pool.query(
      `ALTER TABLE campaign_members
       ADD COLUMN IF NOT EXISTS last_joined_at TIMESTAMPTZ DEFAULT NULL`
    );
    console.log('[migration] last_joined_at column ready ✓');
  } catch (err) {
    console.error('[migration] add_campaign_member_last_joined failed:', err.message);
    throw err;
  }
};
