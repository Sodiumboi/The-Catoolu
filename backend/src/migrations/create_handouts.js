const pool = require('../config/db');

module.exports = async function createHandouts() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS handouts (
      id          SERIAL PRIMARY KEY,
      uuid        VARCHAR(36) NOT NULL UNIQUE DEFAULT gen_random_uuid()::VARCHAR,
      campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      created_by  INTEGER NOT NULL REFERENCES users(id),
      title       VARCHAR(200) NOT NULL DEFAULT 'Untitled',
      type        VARCHAR(10) NOT NULL CHECK (type IN ('image', 'text', 'bundle')),
      content     TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS handout_bundle_items (
      id        SERIAL PRIMARY KEY,
      bundle_id INTEGER NOT NULL REFERENCES handouts(id) ON DELETE CASCADE,
      item_id   INTEGER NOT NULL REFERENCES handouts(id) ON DELETE CASCADE,
      position  INTEGER NOT NULL DEFAULT 0,
      UNIQUE(bundle_id, item_id),
      CHECK (bundle_id != item_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS handout_shares (
      id          SERIAL PRIMARY KEY,
      uuid        VARCHAR(36) NOT NULL UNIQUE DEFAULT gen_random_uuid()::VARCHAR,
      handout_id  INTEGER NOT NULL REFERENCES handouts(id) ON DELETE CASCADE,
      campaign_id INTEGER NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
      shared_by   INTEGER NOT NULL REFERENCES users(id),
      shared_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_handouts_campaign        ON handouts(campaign_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_handout_bundle_items_bundle ON handout_bundle_items(bundle_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_handout_shares_campaign   ON handout_shares(campaign_id)`);
};
