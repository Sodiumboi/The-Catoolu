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

// Serve uploaded files (avatars etc.) as static
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Health Check ───────────────────────────────────────────
// A simple endpoint to confirm the server is running
// Try it in your browser: http://localhost:3001/api/health
app.get('/api/health', (req, res) => {
  res.json({
    status:    'ok',
    message:   '🐙 CoC Manager API is running',
    timestamp: new Date().toISOString()
  });
});

// ── Routes ─────────────────────────────────────────────────
app.use('/api/auth',       authRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/profile',    profileRoutes);
app.use('/api/campaigns',  require('./routes/campaigns'));
app.use('/api/dice',       require('./routes/dice'));

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

// Start listening
httpServer.listen(PORT, () => {
  console.log('');
  console.log('🐙 ═══════════════════════════════════════════');
  console.log('   CoC Manager API running on port', PORT);
  console.log('   http://localhost:' + PORT + '/api/health');
  console.log('🐙 ═══════════════════════════════════════════');
  console.log('');
});
