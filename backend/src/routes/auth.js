// ============================================================
// Authentication Routes
// POST /api/auth/register  ← Create a new user account
// POST /api/auth/login     ← Log in, receive a JWT token
// GET  /api/auth/me        ← Get current user's info (protected)
// ============================================================

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const pool     = require('../config/db');
const auth     = require('../middleware/auth');
const crypto   = require('crypto');
const passport = require('../config/passport');
const { sendPasswordResetEmail, buildResetEmailHtml } = require('../config/email');

const router = express.Router();

// ── Helper: create a JWT token for a user ──────────────────
function createToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, email: user.email, is_admin: user.is_admin || false },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );
}

// ── POST /api/auth/register ────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // ── Validation ──
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    if (username.length < 3 || username.length > 50) {
      return res.status(400).json({ error: 'Username must be 3–50 characters.' });
    }

    // ── Check for existing user ──
    const existing = await pool.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email.toLowerCase(), username]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'An account with that email or username already exists.' });
    }

    // ── Hash the password (NEVER store plaintext passwords) ──
    // bcrypt's second argument (12) is the "salt rounds" — higher = more secure but slower.
    // 12 is the industry-standard sweet spot.
    const hashedPassword = await bcrypt.hash(password, 12);

    // ── Insert into database ──
    const result = await pool.query(
      `INSERT INTO users (username, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, username, email, avatar_url, created_at`,
      [username, email.toLowerCase(), hashedPassword]
    );

    const newUser = result.rows[0];
    const token   = createToken(newUser);

    res.status(201).json({
      message: 'Account created successfully!',
      token,
      user: {
        id:         newUser.id,
        username:   newUser.username,
        email:      newUser.email,
        avatar_url: newUser.avatar_url || null,
      }
    });

  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// ── POST /api/auth/login ───────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Email/username and password are required.' });
    }

    // ── Find user by email or username ──
    const result = await pool.query(
      'SELECT id, username, email, password, avatar_url, is_admin FROM users WHERE email = $1 OR username = $2',
      [identifier.toLowerCase(), identifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const user = result.rows[0];

    // OAuth-only accounts have no password set
    if (!user.password) {
      return res.status(401).json({ error: 'This account uses Discord or Google login — no password is set.' });
    }

    // ── Compare password against stored hash ──
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = createToken(user);

    res.json({
      message: 'Logged in successfully!',
      token,
      user: {
        id:         user.id,
        username:   user.username,
        email:      user.email,
        avatar_url: user.avatar_url || null,
        is_admin:   user.is_admin || false,
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login.' });
  }
});

// ── GET /api/auth/me (protected) ──────────────────────────
// Useful for the frontend to verify the token is still valid
// and get current user info on page load
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({ user: result.rows[0] });

  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/auth/forgot-password ────────────────────────
// Step 1: User submits their email
// We generate a token and email them a reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    // Look up the user
    const result = await pool.query(
      'SELECT id, username, email FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    // IMPORTANT: always return the same response whether email exists or not.
    // This prevents attackers from discovering which emails are registered.
    if (result.rows.length === 0) {
      return res.json({ message: 'If that email exists, a reset link has been sent.' });
    }

    const user = result.rows[0];

    // Delete any existing tokens for this user (only one active reset at a time)
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [user.id]
    );

    // Generate a cryptographically secure random token
    const token     = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await pool.query(
      'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt]
    );

    // Send the email
    await sendPasswordResetEmail(user.email, token, user.username);

    res.json({ message: 'If that email exists, a reset link has been sent.' });

  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── POST /api/auth/reset-password ─────────────────────────
// Step 2: User submits new password with their token
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    // Find the token and check it hasn't expired
    const tokenResult = await pool.query(
      `SELECT prt.id, prt.user_id, prt.expires_at, u.username, u.email
       FROM password_reset_tokens prt
       JOIN users u ON u.id = prt.user_id
       WHERE prt.token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({ error: 'Reset link is invalid or has already been used.' });
    }

    const resetData = tokenResult.rows[0];

    // Check expiry
    if (new Date() > new Date(resetData.expires_at)) {
      // Clean up expired token
      await pool.query('DELETE FROM password_reset_tokens WHERE id = $1', [resetData.id]);
      return res.status(400).json({ error: 'Reset link has expired. Please request a new one.' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update the user's password
    await pool.query(
      'UPDATE users SET password = $1 WHERE id = $2',
      [hashedPassword, resetData.user_id]
    );

    // Delete the token — it's single-use
    await pool.query('DELETE FROM password_reset_tokens WHERE id = $1', [resetData.id]);

    // Log the user in automatically by returning a new token
    const userResult = await pool.query(
      'SELECT id, username, email FROM users WHERE id = $1',
      [resetData.user_id]
    );
    const user  = userResult.rows[0];
    const jwtToken = createToken(user);

    res.json({
      message: 'Password reset successfully!',
      token:   jwtToken,
      user:    { id: user.id, username: user.username, email: user.email },
    });

  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({ error: 'Server error. Please try again.' });
  }
});

// ── GET /api/auth/preview/reset-email — dev-only HTML preview ──
router.get('/preview/reset-email', (req, res) => {
  if (process.env.NODE_ENV === 'production') return res.status(404).end();
  const html = buildResetEmailHtml(
    'Investigator',
    'http://localhost:5173/reset-password?token=preview-token-1234'
  );
  res.setHeader('Content-Type', 'text/html');
  res.send(html);
});

// ── OAuth helpers ──────────────────────────────────────────
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

function oauthSuccess(user, res) {
  const token    = createToken(user);
  const userData = { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url || null, is_admin: user.is_admin || false };
  const q        = new URLSearchParams({ token, user: JSON.stringify(userData) });
  res.redirect(`${FRONTEND_URL}/oauth-callback?${q.toString()}`);
}

function oauthFail(res, reason) {
  res.redirect(`${FRONTEND_URL}/login?error=${encodeURIComponent(reason)}`);
}

// ── Discord OAuth ──────────────────────────────────────────
router.get('/discord', passport.authenticate('discord'));

router.get('/discord/callback',
  passport.authenticate('discord', { session: false, failWithError: true }),
  (req, res) => oauthSuccess(req.user, res),
  (err, req, res, _next) => oauthFail(res, 'discord_failed')
);

// ── Google OAuth ───────────────────────────────────────────
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback',
  passport.authenticate('google', { session: false, failWithError: true }),
  (req, res) => oauthSuccess(req.user, res),
  (err, req, res, _next) => oauthFail(res, 'google_failed')
);

// ── DELETE /api/auth/discord — disconnect Discord ──────────
router.delete('/discord', auth, async (req, res) => {
  try {
    const row = await pool.query('SELECT password, google_id FROM users WHERE id = $1', [req.user.id]);
    const u   = row.rows[0];
    if (!u.password && !u.google_id) {
      return res.status(400).json({ error: 'Cannot disconnect Discord — it is your only login method.' });
    }
    await pool.query('UPDATE users SET discord_id = NULL WHERE id = $1', [req.user.id]);
    res.json({ message: 'Discord disconnected.' });
  } catch (err) {
    console.error('Disconnect Discord error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── DELETE /api/auth/google — disconnect Google ────────────
router.delete('/google', auth, async (req, res) => {
  try {
    const row = await pool.query('SELECT password, discord_id FROM users WHERE id = $1', [req.user.id]);
    const u   = row.rows[0];
    if (!u.password && !u.discord_id) {
      return res.status(400).json({ error: 'Cannot disconnect Google — it is your only login method.' });
    }
    await pool.query('UPDATE users SET google_id = NULL WHERE id = $1', [req.user.id]);
    res.json({ message: 'Google disconnected.' });
  } catch (err) {
    console.error('Disconnect Google error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// ── POST /api/auth/set-password — add password to OAuth-only account ──
router.post('/set-password', auth, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }
    const row = await pool.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (row.rows[0].password) {
      return res.status(400).json({ error: 'You already have a password. Use Change Password instead.' });
    }
    const hashed = await bcrypt.hash(password, 12);
    await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, req.user.id]);
    res.json({ message: 'Password set successfully!' });
  } catch (err) {
    console.error('Set password error:', err);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
