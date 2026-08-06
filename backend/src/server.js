// ============================================================
// Main Express Server
// This file:
//   1. Creates the Express app
//   2. Applies middleware (CORS, JSON parsing)
//   3. Mounts the route handlers
//   4. Starts listening on the configured port
// ============================================================

const express = require('express');
const cors    = require('cors');
const path    = require('path');
require('dotenv').config();

// Migrations
const addCampaignUuid    = require('./migrations/add_campaign_uuid');
const createCharacterDrafts = require('./migrations/create_character_drafts');
const addOAuthColumns    = require('./migrations/add_oauth_columns');
const createBugReports   = require('./migrations/create_bug_reports');
const addAdminColumn     = require('./migrations/add_admin_column');
const createAppSettings  = require('./migrations/create_app_settings');
const createNotes        = require('./migrations/create_notes');
const createHandouts     = require('./migrations/create_handouts');
const addImageUrlsToMessages = require('./migrations/add_image_urls_to_messages');
const createUserUploads  = require('./migrations/create_user_uploads');
const addCampaignMemberLastJoined = require('./migrations/add_campaign_member_last_joined');
const trimLongCampaignNames = require('./migrations/trim_long_campaign_names');
const addSessionLuckEnabled = require('./migrations/add_session_luck_enabled');

// Auth
const session  = require('express-session');
const passport = require('./config/passport');

// Route handlers
const authRoutes       = require('./routes/auth');
const characterRoutes  = require('./routes/characters');
const profileRoutes    = require('./routes/profile');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ─────────────────────────────────────────────

// CORS: Allows your React frontend (on port 5173) to talk to
// this backend (on port 3001). Without this, the browser blocks the request.
app.use(cors({
  origin: [
    'http://localhost:5173',    // Vite dev server
    'http://localhost:3000',    // fallback
  ],
  credentials: true
}));

// Parse incoming JSON request bodies
// Without this, req.body would be undefined
app.use(express.json({ limit: '10mb' })); // 10mb to allow base64 portrait images

// Session — needed only for the OAuth state parameter (CSRF protection during OAuth dance)
app.use(session({
  secret:            process.env.SESSION_SECRET || 'dev-session-secret-change-in-prod',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge:   10 * 60 * 1000, // 10 min — just enough for the OAuth redirect round-trip
  },
}));
app.use(passport.initialize());

// Serve uploaded files (avatars etc.) as static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health / Maintenance check ─────────────────────────────
app.get('/api/health', async (req, res) => {
  try {
    const pool = require('./config/db');
    const [modeRow, msgRow] = await Promise.all([
      pool.query("SELECT value FROM app_settings WHERE key = 'maintenance_mode'"),
      pool.query("SELECT value FROM app_settings WHERE key = 'maintenance_message'"),
    ]);
    if (modeRow.rows[0]?.value === 'true') {
      return res.json({
        status:  'maintenance',
        message: msgRow.rows[0]?.value || 'We are updating. Back soon.',
      });
    }
    res.json({ status: 'ok' });
  } catch {
    res.json({ status: 'ok' }); // DB hiccup ≠ maintenance
  }
});

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/profile',    profileRoutes);
app.use('/api/campaigns',  require('./routes/campaigns'));
app.use('/api/dice',       require('./routes/dice'));
app.use('/api/bugs',       require('./routes/bugs'));
app.use('/api/admin',      require('./routes/admin'));
app.use('/api/notes',      require('./routes/notes'));
app.use('/api/campaigns',  require('./routes/handouts'));


// ── 404 Handler ────────────────────────────────────────────
// Catches any request to a route that doesn't exist
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Global Error Handler ───────────────────────────────────
// Catches any unhandled errors in route handlers
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'An unexpected server error occurred.' });
});

// Create the HTTP server explicitly
const http = require('http');
const { setupSocket } = require('./socket');

const httpServer = http.createServer(app);

// Attach Socket.io to the HTTP server
const io = setupSocket(httpServer);

// Make io available to routes if needed later
app.set('io', io);

async function startServer() {
  await addCampaignUuid();
  await createCharacterDrafts();
  await addOAuthColumns();
  await createBugReports();
  await addAdminColumn();
  await createAppSettings();
  await createNotes();
  await createHandouts();
  await addImageUrlsToMessages();
  await createUserUploads();
  await addCampaignMemberLastJoined();
  await trimLongCampaignNames();
  await addSessionLuckEnabled();

  httpServer.listen(PORT, () => {
    console.log('');
    console.log('🐙 ═══════════════════════════════════════════');
    console.log('   CoC Manager API running on port', PORT);
    console.log('   http://localhost:' + PORT + '/api/health');
    console.log('🐙 ═══════════════════════════════════════════');
    console.log('');
  });
}

startServer();
