// Per-user upload quota, backed by the user_uploads table.
//  - Total storage cap:  200 MB per user (sum of all tracked uploads)
//  - Rolling rate cap:    50 MB per 5 minutes
// Records are created on every user-attributable upload (avatar / handout / bug).

const pool = require('../config/db');
const { getR2Size } = require('./uploadToR2');

const TOTAL_LIMIT  = 200 * 1024 * 1024; // 200 MB
const WINDOW_MS    = 5 * 60 * 1000;     // 5 minutes
const WINDOW_LIMIT = 50 * 1024 * 1024;  // 50 MB / 5 min

async function getQuota(userId) {
  const [totalRes, windowRes] = await Promise.all([
    pool.query(
      'SELECT COALESCE(SUM(size_bytes), 0)::bigint AS bytes FROM user_uploads WHERE user_id = $1',
      [userId]
    ),
    pool.query(
      `SELECT COALESCE(SUM(size_bytes), 0)::bigint AS bytes
       FROM user_uploads
       WHERE user_id = $1 AND created_at > NOW() - INTERVAL '5 minutes'`,
      [userId]
    ),
  ]);
  return {
    totalUsed:   Number(totalRes.rows[0].bytes),
    totalLimit:  TOTAL_LIMIT,
    windowUsed:  Number(windowRes.rows[0].bytes),
    windowLimit: WINDOW_LIMIT,
    windowMs:    WINDOW_MS,
  };
}

// Returns { ok: true } or { ok: false, reason: 'total' | 'window', quota }.
async function canUpload(userId, size) {
  const quota = await getQuota(userId);
  if (quota.totalUsed + size > quota.totalLimit)   return { ok: false, reason: 'total',  quota };
  if (quota.windowUsed + size > quota.windowLimit) return { ok: false, reason: 'window', quota };
  return { ok: true, quota };
}

async function recordUpload(userId, { url, size, kind, campaignId = null }) {
  await pool.query(
    `INSERT INTO user_uploads (user_id, url, size_bytes, kind, campaign_id)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (user_id, url) DO UPDATE SET size_bytes = EXCLUDED.size_bytes, kind = EXCLUDED.kind`,
    [userId, url, size, kind, campaignId]
  );
}

// Drop tracking row(s) for a URL — used when a file is replaced or deleted
// through another path (e.g. avatar replace, handout delete).
async function untrackByUrl(url) {
  if (!url) return;
  await pool.query('DELETE FROM user_uploads WHERE url = $1', [url]);
}

// Build the authoritative list of a user's files straight from the source
// tables, so the storage view reflects reality (incl. files uploaded before
// tracking existed). Each entry: { url, kind, campaignId }.
async function collectSources(userId) {
  const sources = [];
  const av = await pool.query('SELECT avatar_url FROM users WHERE id = $1', [userId]);
  const avatarUrl = av.rows[0]?.avatar_url;
  if (avatarUrl && avatarUrl.startsWith(process.env.R2_PUBLIC_URL)) {
    sources.push({ url: avatarUrl, kind: 'avatar', campaignId: null });
  }
  const ho = await pool.query(
    `SELECT content, campaign_id FROM handouts
     WHERE created_by = $1 AND type = 'image' AND content IS NOT NULL`,
    [userId]
  );
  for (const r of ho.rows) sources.push({ url: r.content, kind: 'handout', campaignId: r.campaign_id });
  const bg = await pool.query(
    'SELECT image_url FROM bug_reports WHERE user_id = $1 AND image_url IS NOT NULL',
    [userId]
  );
  for (const r of bg.rows) sources.push({ url: r.image_url, kind: 'bug', campaignId: null });
  return sources.filter(s => s.url && s.url.startsWith(process.env.R2_PUBLIC_URL));
}

// Sync user_uploads with the source tables: back-fill any untracked files
// (fetching their real size from R2) and, when prune=true, drop rows whose
// source no longer exists.
async function reconcile(userId, { prune = false } = {}) {
  const sources = await collectSources(userId);

  const tracked    = await pool.query('SELECT url FROM user_uploads WHERE user_id = $1', [userId]);
  const trackedSet = new Set(tracked.rows.map(r => r.url));

  const missing = sources.filter(s => !trackedSet.has(s.url));
  await Promise.all(missing.map(async (m) => {
    const size = await getR2Size(m.url);
    await pool.query(
      `INSERT INTO user_uploads (user_id, url, size_bytes, kind, campaign_id)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, url) DO NOTHING`,
      [userId, m.url, size, m.kind, m.campaignId]
    );
  }));

  if (prune) {
    await pool.query(
      'DELETE FROM user_uploads WHERE user_id = $1 AND NOT (url = ANY($2::text[]))',
      [userId, sources.map(s => s.url)]
    );
  }
}

module.exports = {
  getQuota, canUpload, recordUpload, untrackByUrl, reconcile,
  TOTAL_LIMIT, WINDOW_MS, WINDOW_LIMIT,
};
