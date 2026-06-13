const passport        = require('passport');
const DiscordStrategy = require('passport-discord').Strategy;
const GoogleStrategy  = require('passport-google-oauth20').Strategy;
const pool            = require('./db');

// ── Helper: find or create user, return the DB row ────────
async function findOrCreateByOAuth({ providerField, providerId, email, baseUsername }) {
  // 1. Existing account with this provider ID
  let result = await pool.query(`SELECT * FROM users WHERE ${providerField} = $1`, [providerId]);
  if (result.rows.length > 0) return result.rows[0];

  // 2. Existing account with same email → link provider
  if (email) {
    result = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()]);
    if (result.rows.length > 0) {
      await pool.query(`UPDATE users SET ${providerField} = $1 WHERE id = $2`, [providerId, result.rows[0].id]);
      return result.rows[0];
    }
  }

  // 3. Create a new account (username uniqueness loop)
  let username = (baseUsername || 'user').slice(0, 40);
  let suffix   = 1;
  while (true) {
    const clash = await pool.query('SELECT id FROM users WHERE username = $1', [username]);
    if (clash.rows.length === 0) break;
    username = (baseUsername || 'user').slice(0, 38) + suffix++;
  }

  const col    = providerField;
  const newRow = await pool.query(
    `INSERT INTO users (username, email, ${col}, oauth_provider) VALUES ($1, $2, $3, $4) RETURNING *`,
    [username, email ? email.toLowerCase() : null, providerId, col.replace('_id', '')]
  );
  return newRow.rows[0];
}

// ── Discord ────────────────────────────────────────────────
if (process.env.DISCORD_CLIENT_ID) {
  passport.use(new DiscordStrategy(
    {
      clientID:    process.env.DISCORD_CLIENT_ID,
      clientSecret:process.env.DISCORD_CLIENT_SECRET,
      callbackURL: process.env.DISCORD_CALLBACK_URL,
      scope:       ['identify', 'email'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const user = await findOrCreateByOAuth({
          providerField: 'discord_id',
          providerId:    profile.id,
          email:         profile.email,
          baseUsername:  profile.global_name || profile.username,
        });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
} else {
  console.warn('[passport] DISCORD_CLIENT_ID not set — Discord OAuth disabled');
}

// ── Google ─────────────────────────────────────────────────
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy(
    {
      clientID:    process.env.GOOGLE_CLIENT_ID,
      clientSecret:process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;
        const user  = await findOrCreateByOAuth({
          providerField: 'google_id',
          providerId:    profile.id,
          email,
          baseUsername:  profile.displayName || 'google_user',
        });
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  ));
} else {
  console.warn('[passport] GOOGLE_CLIENT_ID not set — Google OAuth disabled');
}

module.exports = passport;
