const pool = require('../config/db');

// Replaces the scalar image_url column with an image_urls JSONB array so chat
// messages can carry a gallery of R2 image URLs. Idempotent — safe to re-run.
//
// The DROP of the legacy scalar column is safe here because the prior column was
// added by uncommitted local-dev work and never deployed. The new column defaults
// to an empty JSONB array so existing rows render correctly.
module.exports = async function addImageUrlsToMessages() {
  await pool.query(`
    ALTER TABLE messages
    DROP COLUMN IF EXISTS image_url
  `);
  await pool.query(`
    ALTER TABLE messages
    ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb
  `);
};
