// ============================================================
// One-time migration: backfill UUIDs for characters that were
// imported before the UUID patch.
//
// Run on the server:
//   node scripts/backfill-uuids.js
//   (from inside the backend/ directory, uses .env.production)
// ============================================================

const { Pool } = require('pg');
const crypto   = require('crypto');
require('dotenv').config({ path: '.env.production' });

const pool = new Pool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  database: process.env.DB_NAME,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function main() {
  console.log('\n══════════════════════════════════════════════');
  console.log('  The Catoolu — UUID Backfill Migration');
  console.log('══════════════════════════════════════════════\n');

  // ── Stats snapshot ───────────────────────────────────────
  const [totalRes, userRes, missingRes] = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS n FROM characters'),
    pool.query('SELECT COUNT(*)::int AS n FROM users'),
    pool.query(`
      SELECT id, name, created_at
      FROM characters
      WHERE sheet_data->'Investigator'->'Header'->>'UUID' IS NULL
      ORDER BY created_at
    `),
  ]);

  const total   = totalRes.rows[0].n;
  const users   = userRes.rows[0].n;
  const missing = missingRes.rows;

  console.log(`  Users in database       : ${users}`);
  console.log(`  Characters in database  : ${total}`);
  console.log(`  Already have a UUID     : ${total - missing.length}`);
  console.log(`  Missing UUID (to patch) : ${missing.length}`);
  console.log('');

  if (missing.length === 0) {
    console.log('  ✓ All characters already have UUIDs. Nothing to do.\n');
    await pool.end();
    return;
  }

  // ── Backfill ─────────────────────────────────────────────
  console.log('  Patching...\n');

  for (const char of missing) {
    const uuid = crypto.randomUUID();
    await pool.query(
      `UPDATE characters
       SET sheet_data = jsonb_set(
         sheet_data,
         '{Investigator,Header,UUID}',
         $1::jsonb
       )
       WHERE id = $2`,
      [JSON.stringify(uuid), char.id]
    );
    console.log(`  ✓  "${char.name}" (id ${char.id})  →  ${uuid}`);
  }

  console.log(`\n  Done — ${missing.length} character(s) patched.\n`);
  console.log('══════════════════════════════════════════════\n');

  await pool.end();
}

main().catch(err => {
  console.error('\n✗ Migration failed:', err.message);
  process.exit(1);
});
