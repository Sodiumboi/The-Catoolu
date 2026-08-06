const { Server } = require('socket.io');
const { randomUUID } = require('crypto');
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
  KEEPER_ROLL_REQUEST:        'keeper:roll_request',
  KEEPER_ROLL_REQUEST_CANCEL: 'keeper:roll_request_cancel',
  PLAYER_ROLL_RESPONSE:       'player:roll_response',
  HANDOUT_SHARED:             'handout:shared',
  REQUEST_LUCK_ROLL:          'request_luck_roll',
  SUBMIT_LUCK_ROLL:           'submit_luck_roll',

  // Server → Client
  JOINED:          'joined',
  LUCK_ROLL_REQUEST:   'luck_roll_request',
  LUCK_ROLL_REQUESTED: 'luck_roll_requested',
  LUCK_ROLL_COMPLETE:  'luck_roll_complete',
  LUCK_UPDATED:        'luck_updated',
  RECEIVE_MESSAGE: 'receive_message',
  USER_JOINED:     'user_joined',
  USER_LEFT:       'user_left',
  TYPING_START:    'typing_start',
  TYPING_STOP:     'typing_stop',
  SHEET_UPDATED:   'sheet_updated',
  ERROR:           'error',
};

// ── Room name helper ───────────────────────────────────────────
const roomName = (campaignId) => `campaign:${campaignId}`;

// ── Session Luck request registry ──────────────────────────────
// requestId → Set of userIds still allowed to submit a Luck roll for it.
// Without this any client could emit submit_luck_roll at will and reroll its
// own Luck; a submission is only honoured if the Keeper asked for it.
// Entries self-expire so abandoned requests don't accumulate.
const pendingLuckRequests = new Map();
const LUCK_REQUEST_TTL_MS = 60_000;

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
      // socket.data is preserved by io.fetchSockets(); socket.user is not.
      socket.data.userId = decoded.id;
      next();
    } catch {
      next(new Error('Authentication failed.'));
    }
  });

  // ── Connection handler ────────────────────────────────────────
  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Personal room — used to push new_notification events to a specific user
    // regardless of which campaign room (if any) they are in.
    socket.join('user:' + socket.user.id);

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

        // Fire-and-forget: update last_joined_at; failure must not break the join
        pool.query(
          'UPDATE campaign_members SET last_joined_at = NOW() WHERE campaign_id = $1 AND user_id = $2',
          [campaignId, socket.user.id]
        ).catch(err => console.error('last_joined_at update failed:', err.message));

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
    socket.on(EVENTS.SEND_MESSAGE, async ({ campaignId, content, image_urls = [] }) => {
      try {
        // Only trust image URLs that point at our own R2 CDN — prevents clients
        // from injecting arbitrary external URLs into the feed. Cap the array length
        // to avoid oversized JSONB blobs from malicious clients (truncate silently).
        const safeImageUrls = Array.isArray(image_urls)
          ? image_urls
              .filter(u =>
                typeof u === 'string' &&
                process.env.R2_PUBLIC_URL &&
                u.startsWith(process.env.R2_PUBLIC_URL))
              .slice(0, 10)
          : [];

        const text = (content ?? '').trim();
        // A message must carry either text or at least one image.
        if (text.length === 0 && safeImageUrls.length === 0) return;
        if (text.length > 2000) {
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

        // Fetch avatar/portrait before insert — stored on the message row
        const [userRes, charRes] = await Promise.all([
          pool.query('SELECT avatar_url FROM users WHERE id = $1', [socket.user.id]),
          pool.query(
            `SELECT c.portrait_data AS portrait,
                    sheet_data->'Investigator'->'PersonalDetails'->>'Name' AS character_name
             FROM characters c
             JOIN campaign_members cm ON cm.character_id = c.id
             WHERE cm.campaign_id = $1 AND cm.user_id = $2
             LIMIT 1`,
            [campaignId, socket.user.id]
          ),
        ]);

        const avatarUrl     = userRes.rows[0]?.avatar_url     || null;
        const portrait      = charRes.rows[0]?.portrait       || null;
        const characterName = charRes.rows[0]?.character_name || null;

        // Save to database — avatar/portrait stored so history is self-contained.
        // image_urls stored as JSONB (parameter is a JSON string cast to ::jsonb).
        const result = await pool.query(
          `INSERT INTO messages
             (campaign_id, user_id, type, content,
              avatar_url, portrait, character_name, image_urls)
           VALUES ($1, $2, 'chat', $3, $4, $5, $6, $7::jsonb)
           RETURNING id, type, content, created_at,
                     avatar_url, portrait, character_name, image_urls`,
          [campaignId, socket.user.id, text,
           avatarUrl, portrait, characterName, JSON.stringify(safeImageUrls)]
        );

        const message = {
          ...result.rows[0],
          // pg returns JSONB as a parsed JS value — coerce null to [] defensively
          image_urls:    result.rows[0].image_urls || [],
          campaign_id:   campaignId,
          campaign_name: socket.currentCampaignName,
          user_id:       socket.user.id,
          username:      socket.user.username,
        };

        // Broadcast to everyone in the room (including sender)
        io.to(roomName(campaignId)).emit(EVENTS.RECEIVE_MESSAGE, message);

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

        // Fetch avatar/portrait before insert — stored on the message row
        const [userRes, charRes] = await Promise.all([
          pool.query('SELECT avatar_url FROM users WHERE id = $1', [socket.user.id]),
          pool.query(
            `SELECT c.portrait_data AS portrait,
                    sheet_data->'Investigator'->'PersonalDetails'->>'Name' AS character_name
             FROM characters c
             JOIN campaign_members cm ON cm.character_id = c.id
             WHERE cm.campaign_id = $1 AND cm.user_id = $2
             LIMIT 1`,
            [campaignId, socket.user.id]
          ),
        ]);

        const avatarUrl     = userRes.rows[0]?.avatar_url     || null;
        const portrait      = charRes.rows[0]?.portrait       || null;
        const characterName = charRes.rows[0]?.character_name || null;

        // Save to database as JSON string
        const content = JSON.stringify(result);

        const dbResult = await pool.query(
          `INSERT INTO messages
             (campaign_id, user_id, type, content,
              avatar_url, portrait, character_name)
           VALUES ($1, $2, 'roll', $3, $4, $5, $6)
           RETURNING id, type, content, created_at,
                     avatar_url, portrait, character_name`,
          [campaignId, socket.user.id, content,
           avatarUrl, portrait, characterName]
        );

        const message = {
          ...dbResult.rows[0],
          campaign_id:   campaignId,
          campaign_name: socket.currentCampaignName,
          user_id:       socket.user.id,
          username:      socket.user.username,
          // Send parsed object — client doesn't need to JSON.parse
          content:  result,
        };

        // Broadcast to everyone in the room
        io.to(roomName(campaignId)).emit(EVENTS.RECEIVE_MESSAGE, message);

        // Auto-roll damage when a weapon attack hits
        const isAttack   = payload.weaponDamage && payload.weaponName;
        const sl         = result.successLevel;
        const isHit      = sl && (
          sl.severity === 'critical' ||
          sl.severity === 'extreme'  ||
          sl.severity === 'hard'     ||
          sl.severity === 'regular'
        );
        console.log('isAttack:', isAttack, 'isHit:', isHit, 'severity:', sl?.severity, 'weaponDamage:', payload.weaponDamage);

        if (isAttack && isHit) {
          const damageNotation = payload.weaponDamage
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/db/g, '')
            .replace(/\+$/, '')
            .trim();

          if (damageNotation && damageNotation !== '—') {
            const damageResult = roll(damageNotation);

            if (!damageResult.error) {
              const damageContent = JSON.stringify({
                ...damageResult,
                isDamage:   true,
                weaponName: payload.weaponName,
              });

              const dmgDbResult = await pool.query(
                `INSERT INTO messages
                   (campaign_id, user_id, type, content,
                    avatar_url, portrait, character_name)
                 VALUES ($1, $2, 'roll', $3, $4, $5, $6)
                 RETURNING id, type, content, created_at,
                           avatar_url, portrait, character_name`,
                [campaignId, socket.user.id, damageContent,
                 avatarUrl, portrait, characterName]
              );

              const damageMessage = {
                ...dmgDbResult.rows[0],
                user_id:  socket.user.id,
                username: socket.user.username,
                content:  { ...damageResult, isDamage: true, weaponName: payload.weaponName },
              };

              setTimeout(() => {
                io.to(roomName(campaignId)).emit(EVENTS.RECEIVE_MESSAGE, damageMessage);
              }, 300);
            }
          }
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
               sheet_data->'Investigator'->'PersonalDetails'->>'Name'                AS name,
               sheet_data->'Investigator'->'PersonalDetails'->>'Occupation'           AS occupation,
               sheet_data->'Investigator'->'Characteristics'->>'HitPts'              AS hit_pts,
               sheet_data->'Investigator'->'Characteristics'->>'HitPtsMax'           AS hit_pts_max,
               sheet_data->'Investigator'->'Characteristics'->>'MagicPts'            AS magic_pts,
               sheet_data->'Investigator'->'Characteristics'->>'MagicPtsMax'         AS magic_pts_max,
               sheet_data->'Investigator'->'Characteristics'->>'Sanity'              AS sanity,
               sheet_data->'Investigator'->'Characteristics'->>'SanityMax'           AS sanity_max,
               portrait_data                                                          AS portrait
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

    // ── KEEPER_ROLL_REQUEST ────────────────────────────────────
    // Routes a roll request to one player (via their personal room) or all players.
    socket.on(EVENTS.KEEPER_ROLL_REQUEST, ({ campaignId, targetUserId, rollType, rollName, rollValue, players, requestId }) => {
      if (targetUserId === 'all' && players) {
        players.forEach(({ userId, rollValue: pVal }) => {
          io.to('user:' + userId).emit(EVENTS.KEEPER_ROLL_REQUEST, {
            rollType, rollName, rollValue: pVal, requestId,
          });
        });
      } else {
        io.to('user:' + targetUserId).emit(EVENTS.KEEPER_ROLL_REQUEST, {
          rollType, rollName, rollValue, requestId,
        });
      }
    });

    // ── PLAYER_ROLL_RESPONSE ────────────────────────────────────
    // Player responds to a keeper roll request — server rolls, saves, and broadcasts.
    socket.on(EVENTS.PLAYER_ROLL_RESPONSE, async ({ campaignId, requestId, rollName, rollValue, notation }) => {
      try {
        const safeNotation = /^1d100(adv|dis)?$/i.test(notation ?? '') ? notation : '1d100';
        const result = roll(safeNotation, rollValue, rollName);
        if (result.error) return;

        const [userRes, charRes] = await Promise.all([
          pool.query('SELECT avatar_url FROM users WHERE id = $1', [socket.user.id]),
          pool.query(
            `SELECT c.portrait_data AS portrait,
                    sheet_data->'Investigator'->'PersonalDetails'->>'Name' AS character_name
             FROM characters c
             JOIN campaign_members cm ON cm.character_id = c.id
             WHERE cm.campaign_id = $1 AND cm.user_id = $2
             LIMIT 1`,
            [campaignId, socket.user.id]
          ),
        ]);

        const avatarUrl     = userRes.rows[0]?.avatar_url     || null;
        const portrait      = charRes.rows[0]?.portrait       || null;
        const characterName = charRes.rows[0]?.character_name || null;

        const rollContent = { ...result, forced: true };

        const dbResult = await pool.query(
          `INSERT INTO messages
             (campaign_id, user_id, type, content, avatar_url, portrait, character_name)
           VALUES ($1, $2, 'roll', $3, $4, $5, $6)
           RETURNING id, type, content, created_at, avatar_url, portrait, character_name`,
          [campaignId, socket.user.id, JSON.stringify(rollContent), avatarUrl, portrait, characterName]
        );

        const message = {
          ...dbResult.rows[0],
          campaign_id:   campaignId,
          campaign_name: socket.currentCampaignName,
          user_id:       socket.user.id,
          username:      socket.user.username,
          content:       rollContent,
        };

        io.to(roomName(campaignId)).emit(EVENTS.RECEIVE_MESSAGE, message);

        // Notify clients to clear the pending request indicator
        io.to(roomName(campaignId)).emit(EVENTS.PLAYER_ROLL_RESPONSE, {
          requestId,
          userId:   socket.user.id,
          username: socket.user.username,
        });
      } catch (err) {
        console.error('player:roll_response error:', err);
      }
    });

    // ── REQUEST_LUCK_ROLL ───────────────────────────────────────
    // Keeper asks every connected player in the room for a fresh Luck roll.
    // Only the players currently in the campaign room are targeted — a request
    // must never surface on a tab that isn't in the session.
    socket.on(EVENTS.REQUEST_LUCK_ROLL, async ({ campaignId }) => {
      try {
        if (!campaignId) return;

        const check = await pool.query(
          `SELECT cm.role, c.session_luck_enabled
           FROM campaign_members cm
           JOIN campaigns c ON c.id = cm.campaign_id
           WHERE cm.campaign_id = $1 AND cm.user_id = $2`,
          [campaignId, socket.user.id]
        );
        const membership = check.rows[0];
        if (!membership || membership.role !== 'keeper') {
          return socket.emit(EVENTS.ERROR, { message: 'Only the Keeper can request a Luck roll.' });
        }
        if (!membership.session_luck_enabled) {
          return socket.emit(EVENTS.ERROR, { message: 'Session Luck is not enabled for this campaign.' });
        }

        const playersRes = await pool.query(
          `SELECT cm.user_id, u.username
           FROM campaign_members cm
           JOIN users u ON u.id = cm.user_id
           WHERE cm.campaign_id = $1 AND cm.role = 'player'`,
          [campaignId]
        );
        const playerNames = new Map(playersRes.rows.map(r => [r.user_id, r.username]));

        const room            = roomName(campaignId);
        const socketsInRoom   = await io.in(room).fetchSockets();
        const requestId       = randomUUID();
        const targeted        = [];

        for (const s of socketsInRoom) {
          const userId = s.data.userId;
          if (!playerNames.has(userId)) continue;   // keeper / non-player
          s.emit(EVENTS.LUCK_ROLL_REQUEST, {
            campaignId,
            requestId,
            requestedBy: socket.user.username,
          });
          if (!targeted.some(t => t.userId === userId)) {
            targeted.push({ userId, username: playerNames.get(userId) });
          }
        }

        if (targeted.length > 0) {
          pendingLuckRequests.set(requestId, new Set(targeted.map(t => t.userId)));
          setTimeout(() => pendingLuckRequests.delete(requestId), LUCK_REQUEST_TTL_MS).unref?.();
        }

        socket.emit(EVENTS.LUCK_ROLL_REQUESTED, { requestId, players: targeted });

        console.log(`🍀 ${socket.user.username} requested Session Luck from ${targeted.length} player(s)`);
      } catch (err) {
        console.error('request_luck_roll error:', err);
        socket.emit(EVENTS.ERROR, { message: 'Failed to request Luck rolls.' });
      }
    });

    // ── SUBMIT_LUCK_ROLL ────────────────────────────────────────
    // Player answers a Luck request. The 3D6×5 roll happens HERE — the client
    // sends no value and none would be trusted.
    socket.on(EVENTS.SUBMIT_LUCK_ROLL, async ({ campaignId, requestId }) => {
      try {
        const allowed = pendingLuckRequests.get(requestId);
        if (!allowed || !allowed.has(socket.user.id)) return;  // unsolicited or already answered
        allowed.delete(socket.user.id);
        if (allowed.size === 0) pendingLuckRequests.delete(requestId);

        const charRes = await pool.query(
          `SELECT c.id, c.uuid, c.portrait_data AS portrait,
                  sheet_data->'Investigator'->'PersonalDetails'->>'Name' AS character_name
           FROM characters c
           JOIN campaign_members cm ON cm.character_id = c.id
           WHERE cm.campaign_id = $1 AND cm.user_id = $2
           LIMIT 1`,
          [campaignId, socket.user.id]
        );
        // Keepers watch pending pills per player — clear this player's either way.
        const notifyKeepers = async (payload) => {
          const keeperRes = await pool.query(
            `SELECT user_id FROM campaign_members
             WHERE campaign_id = $1 AND role = 'keeper'`,
            [campaignId]
          );
          keeperRes.rows.forEach(({ user_id }) => {
            io.to('user:' + user_id).emit(EVENTS.LUCK_ROLL_COMPLETE, {
              requestId,
              userId:   socket.user.id,
              username: socket.user.username,
              ...payload,
            });
          });
        };

        const character = charRes.rows[0];
        if (!character) {
          await notifyKeepers({ luck: null });
          return socket.emit(EVENTS.ERROR, { message: 'No investigator registered — cannot roll Luck.' });
        }

        // CoC 7e Luck = 3D6 × 5, rolled with the shared hardware-entropy engine.
        const base = roll('3d6');
        if (base.error) return;
        const luck = base.total * 5;

        const rollContent = {
          ...base,
          subtotal:  base.total,   // the raw 3D6 sum, before the ×5
          total:     luck,
          isLuck:    true,
          forced:    true,
          skillName: 'Luck Roll',
          summary:   `${base.rolls.join(' + ')} = ${base.total} × 5 = ${luck}`,
        };

        // Both values move together — Session Luck replaces the creation-time
        // Luck outright, so a stale LuckMax would render as "Max 50 / Now 65".
        await pool.query(
          `UPDATE characters
           SET sheet_data = jsonb_set(
             jsonb_set(
               sheet_data,
               ARRAY['Investigator', 'Characteristics', 'Luck'],
               to_jsonb($1::text)
             ),
             ARRAY['Investigator', 'Characteristics', 'LuckMax'],
             to_jsonb($1::text)
           )
           WHERE id = $2`,
          [String(luck), character.id]
        );

        const userRes = await pool.query(
          'SELECT avatar_url FROM users WHERE id = $1', [socket.user.id]
        );

        const dbResult = await pool.query(
          `INSERT INTO messages
             (campaign_id, user_id, type, content, avatar_url, portrait, character_name)
           VALUES ($1, $2, 'roll', $3, $4, $5, $6)
           RETURNING id, type, content, created_at, avatar_url, portrait, character_name`,
          [campaignId, socket.user.id, JSON.stringify(rollContent),
           userRes.rows[0]?.avatar_url || null, character.portrait, character.character_name]
        );

        io.to(roomName(campaignId)).emit(EVENTS.RECEIVE_MESSAGE, {
          ...dbResult.rows[0],
          campaign_id:   campaignId,
          campaign_name: socket.currentCampaignName,
          user_id:       socket.user.id,
          username:      socket.user.username,
          content:       rollContent,
        });

        // Player's own sheet updates without a refetch
        socket.emit(EVENTS.LUCK_UPDATED, {
          character_uuid: character.uuid,
          luck:           String(luck),
        });

        // Keepers with this sheet open re-fetch it (existing signal-then-refetch)
        io.to(roomName(campaignId)).emit(EVENTS.SHEET_UPDATED, { character_uuid: character.uuid });

        await notifyKeepers({
          characterName: character.character_name,
          luck:          String(luck),
        });

        console.log(`🍀 ${socket.user.username} rolled Session Luck → ${luck}`);
      } catch (err) {
        console.error('submit_luck_roll error:', err);
        socket.emit(EVENTS.ERROR, { message: 'Failed to roll Luck.' });
      }
    });

    // ── KEEPER_ROLL_REQUEST_CANCEL ──────────────────────────────
    // Keeper cancels a pending roll request — removes pill from player's screen.
    socket.on(EVENTS.KEEPER_ROLL_REQUEST_CANCEL, ({ campaignId, requestId }) => {
      // Also revokes a Session Luck request of the same id, if that's what it was.
      pendingLuckRequests.delete(requestId);
      io.to(roomName(campaignId)).emit(EVENTS.KEEPER_ROLL_REQUEST_CANCEL, { requestId });
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