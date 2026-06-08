const db = require('../config/db');

async function addCampaignUuid() {
  try {
    const check = await db.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'campaigns' AND column_name = 'uuid'
    `);

    if (check.rows.length > 0) {
      console.log('[migration] campaigns.uuid already exists — skipping');
      return;
    }

    console.log('[migration] Adding uuid column to campaigns...');

    await db.query(`
      ALTER TABLE campaigns ADD COLUMN uuid VARCHAR(36)
    `);

    await db.query(`
      UPDATE campaigns
      SET uuid = gen_random_uuid()::VARCHAR
      WHERE uuid IS NULL
    `);

    await db.query(`
      ALTER TABLE campaigns ALTER COLUMN uuid SET NOT NULL
    `);

    await db.query(`
      ALTER TABLE campaigns
      ADD CONSTRAINT campaigns_uuid_unique UNIQUE (uuid)
    `);

    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_campaigns_uuid ON campaigns(uuid)
    `);

    console.log('[migration] campaigns.uuid migration complete ✓');

  } catch (err) {
    console.error('[migration] campaigns.uuid migration failed:', err.message);
    throw err;
  }
}

module.exports = addCampaignUuid;
