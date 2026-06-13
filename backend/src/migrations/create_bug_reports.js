const pool = require('../config/db');

module.exports = async function createBugReports() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS bug_reports (
      id          SERIAL PRIMARY KEY,
      user_id     INTEGER REFERENCES users(id),
      title       VARCHAR(200) NOT NULL,
      description TEXT NOT NULL,
      image_url   VARCHAR(500),
      page_url    VARCHAR(500),
      user_agent  TEXT,
      status      VARCHAR(20) NOT NULL DEFAULT 'open',
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
};
