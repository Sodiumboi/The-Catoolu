const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');
const pool       = require('./config/db');

// ── Event name constants ───────────────────────────────────────
// Define once, use everywhere. Typos become obvious.
const EVENTS = {
  // Client → Server
  JOIN_CAMPAIGN:   'join_campaign',
  SEND_MESSAGE:    'send_message',
  TYPING:          'typing',
  STOP_TYPING:     'stop_typing',

  // Server → Client
  JOINED:          'joined',
  RECEIVE_MESSAGE: 'receive_message',
  USER_JOINED:     'user_joined',
  USER_LEFT:       'user_left',
  TYPING_START:    'typing_start',
  TYPING_STOP:     'typing_stop',
  ERROR:           'error',
};

// ── Room name helper ───────────────────────────────────────────
const roomName = (campaignId) => `campaign:${campaignId}`;

// ── Main setup function ────────────────────────────────────────
function setupSocket(httpServer) {

  const io = new Server(httpServer, {
    cors: {
      // In development: allow Vite dev server
      // In production: allow same origin (Nginx handles it)
      origin: process.env.NODE_ENV === 'production'
        ? false
        : ['http://localhost:5173', 'http://localhost:3000'],
      methods:           ['GET', 'POST'],
      credentials:       true,
    },
    // How long to wait before considering a connection dead
    pingTimeout:  60000,
    pingInterval: 25000,
  });

  // ── JWT Authentication Middleware ────────────────────────────
  // Runs before any event handler. Rejects unauthenticated connections.
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('No token provided.'));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = { id: decoded.id, username: decoded.username };
      next();
    } catch {
      next(new Error('Authentication failed.'));
    }
  });

  // ── Connection handler ────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // ── JOIN_CAMPAIGN ──────────────────────────────────────────
    // Client emits this when navigating into a campaign room.
    socket.on(EVENTS.JOIN_CAMPAIGN, async (campaignId) => {
      try {
        // Verify the user is actually a member of this campaign
        const memberCheck = await pool.query(
          `SELECT role FROM campaign_members
           WHERE campaign_id = $1 AND user_id = $2`,
          [campaignId, socket.user.id]
        );

        if (memberCheck.rows.length === 0) {
          return socket.emit(EVENTS.ERROR, {
            message: 'You are not a member of this campaign.'
          });
        }

        const role = memberCheck.rows[0].role;

        // Leave any previous campaign room
        // (user can only be in one campaign room at a time)
        const currentRooms = Array.from(socket.rooms).filter(
          r => r.startsWith('campaign:') && r !== socket.id
        );
        for (const room of currentRooms) {
          socket.leave(room);
        }

        // Join the campaign room
        const room = roomName(campaignId);
        socket.join(room);
        socket.currentCampaignId = campaignId;

        // Tell the client it successfully joined
        // Send the current online member list
        const socketsInRoom = await io.in(room).fetchSockets();
        const onlineUsers   = socketsInRoom.map(s => ({
          id:       s.user.id,
          username: s.user.username,
        }));

        socket.emit(EVENTS.JOINED, {
          campaignId,
          role,
          onlineUsers,
        });

        // Tell everyone else in the room this user arrived
        socket.to(room).emit(EVENTS.USER_JOINED, {
          id:       socket.user.id,
          username: socket.user.username,
        });

        console.log(`📋 ${socket.user.username} joined campaign ${campaignId}`);
      } catch (err) {
        console.error('join_campaign error:', err);
        socket.emit(EVENTS.ERROR, { message: 'Failed to join campaign room.' });
      }
    });

    // ── SEND_MESSAGE ───────────────────────────────────────────
    // Client emits this to send a chat message.
    socket.on(EVENTS.SEND_MESSAGE, async ({ campaignId, content }) => {
      try {
        if (!content || content.trim().length === 0) return;
        if (content.trim().length > 2000) {
          return socket.emit(EVENTS.ERROR, {
            message: 'Message too long (max 2000 characters).'
          });
        }

        // Verify still a member (belt-and-suspenders check)
        const memberCheck = await pool.query(
          'SELECT id FROM campaign_members WHERE campaign_id=$1 AND user_id=$2',
          [campaignId, socket.user.id]
        );
        if (memberCheck.rows.length === 0) {
          return socket.emit(EVENTS.ERROR, { message: 'Not a campaign member.' });
        }

        // Save to database
        const result = await pool.query(
          `INSERT INTO messages (campaign_id, user_id, type, content)
           VALUES ($1, $2, 'chat', $3)
           RETURNING id, type, content, created_at`,
          [campaignId, socket.user.id, content.trim()]
        );

        const message = {
          ...result.rows[0],
          user_id:  socket.user.id,
          username: socket.user.username,
        };

        // Broadcast to everyone in the room (including sender)
        io.to(roomName(campaignId)).emit(EVENTS.RECEIVE_MESSAGE, message);

      } catch (err) {
        console.error('send_message error:', err);
        socket.emit(EVENTS.ERROR, { message: 'Failed to send message.' });
      }
    });

    // ── TYPING ─────────────────────────────────────────────────
    // Broadcast typing indicator to other room members.
    socket.on(EVENTS.TYPING, ({ campaignId }) => {
      socket.to(roomName(campaignId)).emit(EVENTS.TYPING_START, {
        username: socket.user.username,
      });
    });

    socket.on(EVENTS.STOP_TYPING, ({ campaignId }) => {
      socket.to(roomName(campaignId)).emit(EVENTS.TYPING_STOP, {
        username: socket.user.username,
      });
    });

    // ── DISCONNECT ─────────────────────────────────────────────
    // Fires when the browser closes, navigates away, or loses connection.
    socket.on('disconnect', (reason) => {
      console.log(`🔌 Socket disconnected: ${reason}`);

      // If they were in a campaign room, tell other members
      if (socket.currentCampaignId) {
        socket.to(roomName(socket.currentCampaignId)).emit(EVENTS.USER_LEFT, {
          id:       socket.user.id,
          username: socket.user.username,
        });
      }
    });
  });

  console.log('🐙 Socket.io initialised');
  return io;
}

module.exports = { setupSocket, EVENTS };