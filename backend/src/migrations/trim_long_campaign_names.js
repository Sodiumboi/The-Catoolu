const pool = require('../config/db');

// One-time cleanup: bring existing campaign names into line with the 100-char
// cap now enforced on create + rename. Idempotent — once every name is within
// 100 chars this matches zero rows on subsequent starts.
module.exports = async function trimLongCampaignNames() {
  try {
    const result = await pool.query(
      `UPDATE campaigns
          SET name = LEFT(name, 100)
        WHERE LENGTH(name) > 100`
    );
    if (result.rowCount > 0) {
      console.log(`[migration] trimmed ${result.rowCount} overlong campaign name(s) to 100 chars ✓`);
    } else {
      console.log('[migration] campaign names already within 100 chars ✓');
    }
  } catch (err) {
    console.error('[migration] trim_long_campaign_names failed:', err.message);
    throw err;
  }
};
