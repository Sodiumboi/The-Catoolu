require('dotenv').config({ path: '.env.production' });
const fs = require('fs');
const path = require('path');
const { uploadToR2 } = require('../src/utils/uploadToR2');
const db = require('../src/config/db');

async function migrate() {
  console.log('Starting upload migration to R2...');

  // Migrate avatars
  const users = await db.query(
    `SELECT id, avatar_url FROM users WHERE avatar_url IS NOT NULL AND avatar_url NOT LIKE 'https://assets.catoolu.quest%'`
  );

  for (const user of users.rows) {
    const localPath = path.join('/app/uploads', user.avatar_url.replace('/uploads/', ''));

    if (!fs.existsSync(localPath)) {
      console.log(`Skipping missing file: ${localPath}`);
      continue;
    }

    const buffer = fs.readFileSync(localPath);
    const filename = path.basename(localPath);
    const url = await uploadToR2(buffer, 'avatars', filename);

    await db.query('UPDATE users SET avatar_url = $1 WHERE id = $2', [url, user.id]);
    console.log(`Migrated avatar for user ${user.id}: ${url}`);
  }

  // Migrate bug screenshots
  const bugs = await db.query(
    `SELECT id, image_url FROM bug_reports WHERE image_url IS NOT NULL AND image_url NOT LIKE 'https://assets.catoolu.quest%'`
  );

  for (const bug of bugs.rows) {
    const localPath = path.join('/app/uploads', bug.image_url.replace('/uploads/', ''));

    if (!fs.existsSync(localPath)) {
      console.log(`Skipping missing file: ${localPath}`);
      continue;
    }

    const buffer = fs.readFileSync(localPath);
    const filename = path.basename(localPath);
    const url = await uploadToR2(buffer, 'bugs', filename);

    await db.query('UPDATE bug_reports SET image_url = $1 WHERE id = $2', [url, bug.id]);
    console.log(`Migrated bug screenshot ${bug.id}: ${url}`);
  }

  console.log('Migration complete.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
