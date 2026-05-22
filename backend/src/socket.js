const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');
const pool       = require('./config/db');
const { roll }   = require('./utils/dice');

// ── Event name constants ───────────────────────────────────────
// Define once, use everywhere. Typos become obvious.
const EVENTS = {
  // Client → Server
  JOIN_CAMPAIGN:   'join_campaign',
  SEND_MESSAGE:    'send_message',
  ROLL_DICE:       'roll_dice',
  TYPING:          'typing',
  STOP_TYPING:     'stop_typing',
  AFK_CHANGE:        'afk_change',
  CHARACTER_CHANGE:  'character_change',

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
        // Verify membership and fetch campaign name + user avatar in one query
        const memberCheck = await pool.query(
          `SELECT cm.role, c.name AS campaign_name, u.avatar_url
           FROM campaign_members cm
           JOIN campaigns c ON c.id = cm.campaign_id
           JOIN users u ON u.id = cm.user_id
           WHERE cm.campaign_id = $1 AND cm.user_id = $2`,
          [campaignId, socket.user.id]
        );

        if (memberCheck.rows.length === 0) {
          return socket.emit(EVENTS.ERROR, {
            message: 'You are not a member of this campaign.'
          });
        }

        const { role, campaign_name, avatar_url } = memberCheck.rows[0];
        // Cache on socket so message handlers can include them in payloads
        socket.currentCampaignName = campaign_name;
        socket.user.avatar_url     = avatar_url || null;

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

        const [userRes, charRes] = await Promise.all([
          pool.query('SELECT avatar_url FROM users WHERE id = $1', [socket.user.id]),
          pool.query(
            `SELECT sheet_data->'Investigator'->'PersonalDetails'->>'Portrait' AS portrait,
                    sheet_data->'Investigator'->'PersonalDetails'->>'Name'      AS character_name
             FROM characters c
             JOIN campaign_members cm ON cm.character_id = c.id
             WHERE cm.campaign_id = $1 AND cm.user_id = $2
             LIMIT 1`,
            [campaignId, socket.user.id]
          ),
        ]);

        const message = {
          ...result.rows[0],
          campaign_id:   campaignId,
          campaign_name: socket.currentCampaignName,
          user_id:       socket.user.id,
          username:      socket.user.username,
          avatar_url:     userRes.rows[0]?.avatar_url        || null,
          portrait:       charRes.rows[0]?.portrait          || null,
          character_name: charRes.rows[0]?.character_name    || null,
        };

        // Broadcast to everyone in the room (including sender)
        io.to(roomName(campaignId)).emit(EVENTS.RECEIVE_MESSAGE, message);

        // Save notification for offline members
        const membersRes = await pool.query(
          'SELECT user_id FROM campaign_members WHERE campaign_id = $1',
          [campaignId]
        );
        const socketsInRoom = await io.in(roomName(campaignId)).fetchSockets();
        const onlineUserIds = new Set(socketsInRoom.map(s => s.user.id));

        for (const member of membersRes.rows) {
          if (member.user_id === socket.user.id) continue;
          if (onlineUserIds.has(member.user_id)) continue;

          await pool.query(
            `INSERT INTO notifications
               (user_id, type, campaign_id, campaign_name,
                sender_name, avatar_url, content, is_pinned)
             VALUES ($1, $2, $3, $4, $5, $6, $7, false)`,
            [
              member.user_id,
              'message',
              campaignId,
              socket.currentCampaignName || '',
              socket.user.username,
              socket.user.avatar_url || null,
              content.trim().slice(0, 120),
            ]
          ).catch(() => {});
        }

      } catch (err) {
        console.error('send_message error:', err);
        socket.emit(EVENTS.ERROR, { message: 'Failed to send message.' });
      }
    });

    // ── ROLL_DICE ──────────────────────────────────────────────
    // Payload: { campaignId, notation, skillName?, skillValue? }
    // notation supports: 1d100, 2d6+3, d20, 1d100adv, 1d100dis
    socket.on(EVENTS.ROLL_DICE, async (payload) => {
      try {
        const { campaignId, notation, skillName, skillValue } = payload;

        if (!campaignId || !notation) {
          return socket.emit(EVENTS.ERROR, { message: 'Invalid roll payload.' });
        }

        // Verify membership
        const memberCheck = await pool.query(
          'SELECT id FROM campaign_members WHERE campaign_id=$1 AND user_id=$2',
          [campaignId, socket.user.id]
        );
        if (memberCheck.rows.length === 0) {
          return socket.emit(EVENTS.ERROR, { message: 'Not a campaign member.' });
        }

        // Roll the dice — crypto.randomInt() under the hood
        const result = roll(notation, skillValue, skillName);

        if (result.error) {
          return socket.emit(EVENTS.ERROR, { message: result.error });
        }

        // Save to database as JSON string
        const content = JSON.stringify(result);

        const dbResult = await pool.query(
          `INSERT INTO messages (campaign_id, user_id, type, content)
           VALUES ($1, $2, 'roll', $3)
           RETURNING id, type, content, created_at`,
          [campaignId, socket.user.id, content]
        );

        const [userRes, charRes] = await Promise.all([
          pool.query('SELECT avatar_url FROM users WHERE id = $1', [socket.user.id]),
          pool.query(
            `SELECT sheet_data->'Investigator'->'PersonalDetails'->>'Portrait' AS portrait,
                    sheet_data->'Investigator'->'PersonalDetails'->>'Name'      AS character_name
             FROM characters c
             JOIN campaign_members cm ON cm.character_id = c.id
             WHERE cm.campaign_id = $1 AND cm.user_id = $2
             LIMIT 1`,
            [campaignId, socket.user.id]
          ),
        ]);

        const message = {
          ...dbResult.rows[0],
          campaign_id:   campaignId,
          campaign_name: socket.currentCampaignName,
          user_id:       socket.user.id,
          username:      socket.user.username,
          avatar_url:     userRes.rows[0]?.avatar_url        || null,
          portrait:       charRes.rows[0]?.portrait          || null,
          character_name: charRes.rows[0]?.character_name    || null,
          // Send parsed object — client doesn't need to JSON.parse
          content:  result,
        };

        // Broadcast to everyone in the room
        io.to(roomName(campaignId)).emit(EVENTS.RECEIVE_MESSAGE, message);

        // Save notification for offline members
        const membersRes = await pool.query(
          'SELECT user_id FROM campaign_members WHERE campaign_id = $1',
          [campaignId]
        );
        const socketsInRoom = await io.in(roomName(campaignId)).fetchSockets();
        const onlineUserIds = new Set(socketsInRoom.map(s => s.user.id));

        for (const member of membersRes.rows) {
          if (member.user_id === socket.user.id) continue;
          if (onlineUserIds.has(member.user_id)) continue;

          await pool.query(
            `INSERT INTO notifications
               (user_id, type, campaign_id, campaign_name,
                sender_name, avatar_url, content, is_pinned)
             VALUES ($1, $2, $3, $4, $5, $6, $7, false)`,
            [
              member.user_id,
              'roll',
              campaignId,
              socket.currentCampaignName || '',
              socket.user.username,
              socket.user.avatar_url || null,
              '🎲 ' + socket.user.username + ' rolled dice',
            ]
          ).catch(() => {});
        }

        console.log(
          `🎲 ${socket.user.username} rolled ${notation}` +
          (result.successLevel ? ` → ${result.total}` : '')
        );

      } catch (err) {
        console.error('roll_dice error:', err);
        socket.emit(EVENTS.ERROR, { message: 'Failed to process roll.' });
      }
    });

    // ── LEAVE_CAMPAIGN ────────────────────────────────────────
    socket.on('leave_campaign', ({ campaignId }) => {
      const room = roomName(campaignId);

      socket.to(room).emit(EVENTS.USER_LEFT, {
        id:       socket.user.id,
        username: socket.user.username,
      });

      socket.leave(room);
      socket.currentCampaignId = null;

      console.log(socket.user.username + ' left campaign ' + campaignId);
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

    // ── AFK_CHANGE ─────────────────────────────────────────────
    // Client toggles AFK status; broadcast to ALL room members
    // including the sender so their own Players panel dot updates.
    socket.on(EVENTS.AFK_CHANGE, ({ campaignId, afk }) => {
      socket.afk = afk;
      io.to(roomName(campaignId)).emit(EVENTS.AFK_CHANGE, {
        userId:   socket.user.id,
        username: socket.user.username,
        afk,
      });
    });

    // ── CHARACTER_CHANGE ───────────────────────────────────────
    // Client emits when they change their active investigator.
    // Broadcasts the update to all room members so the Players panel stays live.
    socket.on(EVENTS.CHARACTER_CHANGE, async ({ campaignId, characterId }) => {
      try {
        const memberCheck = await pool.query(
          'SELECT id FROM campaign_members WHERE campaign_id=$1 AND user_id=$2',
          [campaignId, socket.user.id]
        );
        if (memberCheck.rows.length === 0) return;

        let characterData = null;
        if (characterId) {
          const charRes = await pool.query(
            `SELECT
               id,
               sheet_data->'Investigator'->'PersonalDetails'->>'Name'       AS name,
               sheet_data->'Investigator'->'PersonalDetails'->>'Occupation'  AS occupation
             FROM characters
             WHERE id = $1 AND user_id = $2`,
            [characterId, socket.user.id]
          );
          if (charRes.rows.length > 0) {
            characterData = charRes.rows[0];
          }
        }

        io.to(roomName(campaignId)).emit(EVENTS.CHARACTER_CHANGE, {
          userId:    socket.user.id,
          username:  socket.user.username,
          character: characterData,
        });
      } catch (err) {
        console.error('character_change error:', err);
      }
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