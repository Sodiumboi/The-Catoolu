const pool = require('../config/db');

// Tracks every user-attributable upload (avatar, handout image, bug screenshot)
// so we can enforce a per-user total-storage quota + a rolling rate quota, and
// power the file-management page. Records are created going forward only —
// pre-existing R2 objects are not back-filled (random keys, no user mapping).
module.exports = async function createUserUploads() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS user_uploads (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url         TEXT NOT NULL,
      size_bytes  BIGINT NOT NULL DEFAULT 0,
      kind        VARCHAR(20) NOT NULL,        -- 'avatar' | 'handout' | 'bug'
      campaign_id INTEGER,                     -- set for handout images
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_uploads_user    ON user_uploads(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_user_uploads_created ON user_uploads(created_at)`);
  // One tracking row per (user, url) so backfill/upserts stay idempotent.
  await pool.query(`CREATE UNIQUE INDEX IF NOT EXISTS uniq_user_uploads_user_url ON user_uploads(user_id, url)`);
};
