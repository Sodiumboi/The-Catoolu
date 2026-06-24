const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const auth    = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');
const { buildHandout } = require('./handouts');

// All campaign routes require authentication
router.use(auth);

// ── Helpers ───────────────────────────────────────────────────

function generateInviteCode() {
  // No I, O, 0, 1 — too visually similar
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

async function getUniqueInviteCode() {
  let code;
  let attempts = 0;
  do {
    code = generateInviteCode();
    const exists = await pool.query(
      'SELECT id FROM campaigns WHERE invite_code = $1', [code]
    );
    if (exists.rows.length === 0) break;
    attempts++;
  } while (attempts < 10);
  return code;
}

async function getCampaignByUuid(uuid) {
  const res = await pool.query(
    'SELECT * FROM campaigns WHERE uuid = $1', [uuid]
  );
  return res.rows[0] || null;
}

// Check if user is the keeper of a campaign (numeric id)
async function isKeeper(campaignId, userId) {
  const res = await pool.query(
    `SELECT role FROM campaign_members
     WHERE campaign_id = $1 AND user_id = $2`,
    [campaignId, userId]
  );
  return res.rows[0]?.role === 'keeper';
}

// Check if user is a member of a campaign (numeric id)
async function isMember(campaignId, userId) {
  const res = await pool.query(
    `SELECT id FROM campaign_members
     WHERE campaign_id = $1 AND user_id = $2`,
    [campaignId, userId]
  );
  return res.rows.length > 0;
}

// ── POST /api/campaigns ───────────────────────────────────────
// Create a new campaign. Creator becomes the Keeper.
router.post('/', async (req, res) => {
  try {
    const { name, description = '' } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Campaign name is required.' });
    }
    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Campaign name must be under 100 characters.' });
    }

    const invite_code  = await getUniqueInviteCode();
    const campaignUuid = uuidv4();

    const campaignRes = await pool.query(
      `INSERT INTO campaigns (name, description, keeper_id, invite_code, uuid)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name.trim(), description.trim(), req.user.id, invite_code, campaignUuid]
    );
    const campaign = campaignRes.rows[0];

    // Auto-add the creator as the Keeper member
    await pool.query(
      `INSERT INTO campaign_members (campaign_id, user_id, role)
       VALUES ($1, $2, 'keeper')`,
      [campaign.id, req.user.id]
    );

    // Post a system message to kick off the log
    await pool.query(
      `INSERT INTO messages (campaign_id, user_id, type, content)
       VALUES ($1, NULL, 'system', $2)`,
      [campaign.id, `${req.user.username} created the campaign.`]
    );

    res.status(201).json({ campaign });
  } catch (err) {
    console.error('Create campaign error:', err);
    res.status(500).json({ error: 'Failed to create campaign.' });
  }
});

// ── POST /api/campaigns/join ──────────────────────────────────
// Join a campaign using an invite code.
// MUST be before /:uuid routes — otherwise Express matches /join as a uuid.
router.post('/join', async (req, res) => {
  try {
    const { invite_code } = req.body;

    if (!invite_code) {
      return res.status(400).json({ error: 'Invite code is required.' });
    }

    const campaignRes = await pool.query(
      'SELECT * FROM campaigns WHERE invite_code = $1',
      [invite_code.trim().toUpperCase()]
    );
    if (campaignRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code. Check the code and try again.' });
    }
    const campaign = campaignRes.rows[0];

    if (await isMember(campaign.id, req.user.id)) {
      return res.status(409).json({ error: 'You are already a member of this campaign.' });
    }

    await pool.query(
      `INSERT INTO campaign_members (campaign_id, user_id, role)
       VALUES ($1, $2, 'player')`,
      [campaign.id, req.user.id]
    );

    await pool.query(
      `INSERT INTO messages (campaign_id, user_id, type, content)
       VALUES ($1, NULL, 'system', $2)`,
      [campaign.id, `${req.user.username} joined the investigation.`]
    );

    res.json({ campaign });
  } catch (err) {
    console.error('Join campaign error:', err);
    res.status(500).json({ error: 'Failed to join campaign.' });
  }
});

// ── GET /api/campaigns ────────────────────────────────────────
// List all campaigns the current user belongs to.
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         c.id,
         c.uuid,
         c.name,
         c.description,
         c.invite_code,
         c.keeper_id,
         c.created_at,
         c.updated_at,
         cm.role,
         (SELECT COUNT(*) FROM campaign_members
          WHERE campaign_id = c.id) AS member_count,
         (SELECT username FROM users WHERE id = c.keeper_id) AS keeper_name
       FROM campaigns c
       JOIN campaign_members cm ON c.id = cm.campaign_id
       WHERE cm.user_id = $1
       ORDER BY c.updated_at DESC`,
      [req.user.id]
    );
    res.json({ campaigns: result.rows });
  } catch (err) {
    console.error('List campaigns error:', err);
    res.status(500).json({ error: 'Failed to load campaigns.' });
  }
});

// ── GET /api/campaigns/:uuid ──────────────────────────────────
// Get one campaign with its full member list.
// Only accessible to campaign members.
router.get('/:uuid', async (req, res) => {
  try {
    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }
    const campaignId = campaign.id;

    if (!(await isMember(campaignId, req.user.id))) {
      return res.status(403).json({ error: 'You are not a member of this campaign.' });
    }

    const campaignRes = await pool.query(
      `SELECT c.*, cm.role AS my_role,
              (SELECT username FROM users WHERE id = c.keeper_id) AS keeper_name
       FROM campaigns c
       JOIN campaign_members cm ON c.id = cm.campaign_id
       WHERE c.id = $1 AND cm.user_id = $2`,
      [campaignId, req.user.id]
    );
    if (campaignRes.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }

    const membersRes = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.avatar_url,
         cm.role,
         cm.joined_at,
         cm.character_id,
         (SELECT uuid FROM characters WHERE id = cm.character_id) AS character_uuid,
         (SELECT sheet_data->'Investigator'->'PersonalDetails'->>'Name'
          FROM characters WHERE id = cm.character_id) AS character_name,
         (SELECT sheet_data->'Investigator'->'PersonalDetails'->>'Occupation'
          FROM characters WHERE id = cm.character_id) AS character_occupation,
         (SELECT sheet_data->'Investigator'->'Characteristics'->>'HitPts'
          FROM characters WHERE id = cm.character_id) AS hit_pts,
         (SELECT sheet_data->'Investigator'->'Characteristics'->>'HitPtsMax'
          FROM characters WHERE id = cm.character_id) AS hit_pts_max,
         (SELECT sheet_data->'Investigator'->'Characteristics'->>'MagicPts'
          FROM characters WHERE id = cm.character_id) AS magic_pts,
         (SELECT sheet_data->'Investigator'->'Characteristics'->>'MagicPtsMax'
          FROM characters WHERE id = cm.character_id) AS magic_pts_max,
         (SELECT sheet_data->'Investigator'->'Characteristics'->>'Sanity'
          FROM characters WHERE id = cm.character_id) AS sanity,
         (SELECT sheet_data->'Investigator'->'Characteristics'->>'SanityStart'
          FROM characters WHERE id = cm.character_id) AS sanity_max,
         (SELECT portrait_data
          FROM characters WHERE id = cm.character_id) AS portrait
       FROM campaign_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.campaign_id = $1
       ORDER BY cm.role DESC, cm.joined_at ASC`,
      // DESC so 'keeper' sorts before 'player' alphabetically
      [campaignId]
    );

    res.json({
      campaign: {
        ...campaignRes.rows[0],
        members: membersRes.rows,
      }
    });
  } catch (err) {
    console.error('Get campaign error:', err);
    res.status(500).json({ error: 'Failed to load campaign.' });
  }
});

// ── DELETE /api/campaigns/:uuid/leave ────────────────────────
// Leave a campaign. Keepers cannot leave (they must delete instead).
router.delete('/:uuid/leave', async (req, res) => {
  try {
    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }
    const campaignId = campaign.id;

    if (!(await isMember(campaignId, req.user.id))) {
      return res.status(403).json({ error: 'You are not a member of this campaign.' });
    }

    if (await isKeeper(campaignId, req.user.id)) {
      return res.status(400).json({
        error: 'Keepers cannot leave their own campaign. Delete the campaign instead.'
      });
    }

    await pool.query(
      'DELETE FROM campaign_members WHERE campaign_id = $1 AND user_id = $2',
      [campaignId, req.user.id]
    );

    await pool.query(
      `INSERT INTO messages (campaign_id, user_id, type, content)
       VALUES ($1, NULL, 'system', $2)`,
      [campaignId, `${req.user.username} left the investigation.`]
    );

    res.json({ message: 'Left campaign successfully.' });
  } catch (err) {
    console.error('Leave campaign error:', err);
    res.status(500).json({ error: 'Failed to leave campaign.' });
  }
});

// ── DELETE /api/campaigns/:uuid ───────────────────────────────
// Delete a campaign entirely. Keeper only.
// ON DELETE CASCADE in the schema handles members + messages.
router.delete('/:uuid', async (req, res) => {
  try {
    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }
    const campaignId = campaign.id;

    if (!(await isKeeper(campaignId, req.user.id))) {
      return res.status(403).json({ error: 'Only the Keeper can delete a campaign.' });
    }

    await pool.query('DELETE FROM campaigns WHERE id = $1', [campaignId]);

    res.json({ message: 'Campaign deleted.' });
  } catch (err) {
    console.error('Delete campaign error:', err);
    res.status(500).json({ error: 'Failed to delete campaign.' });
  }
});

// ── GET /api/campaigns/:uuid/messages ────────────────────────
// Fetch message history for a campaign. Members only.
// Paginated: ?limit=50&before=<message_id>
router.get('/:uuid/messages', async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 50, 100);
    const before = req.query.before;

    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }
    const campaignId = campaign.id;

    if (!(await isMember(campaignId, req.user.id))) {
      return res.status(403).json({ error: 'You are not a member of this campaign.' });
    }

    let query;
    let params;

    if (before) {
      query = `
        SELECT m.id, m.type, m.content, m.created_at,
               m.avatar_url, m.portrait, m.character_name, m.image_urls,
               u.id AS user_id, u.username
        FROM messages m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.campaign_id = $1 AND m.id < $2
        ORDER BY m.created_at DESC
        LIMIT $3
      `;
      params = [campaignId, before, limit];
    } else {
      query = `
        SELECT m.id, m.type, m.content, m.created_at,
               m.avatar_url, m.portrait, m.character_name, m.image_urls,
               u.id AS user_id, u.username
        FROM messages m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.campaign_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2
      `;
      params = [campaignId, limit];
    }

    const result = await pool.query(query, params);

    // Return newest-first from the DB, but reverse for display
    // so the frontend always gets oldest → newest order
    const messages = result.rows.reverse();

    res.json({
      messages,
      has_more: result.rows.length === limit,
    });
  } catch (err) {
    console.error('Get messages error:', err);
    res.status(500).json({ error: 'Failed to load messages.' });
  }
});

// ── GET /api/campaigns/:uuid/feed ────────────────────────────
// Unified paginated feed: messages + handout shares, sorted by created_at DESC.
// Composite cursor: before_ts + before_msg_id + before_share_id (strict < semantics,
// so boundary items are never re-fetched). Returns { items, has_more } with items in
// oldest-first display order.
//
// Item shapes (matching the synthetic objects CampaignRoomPage already renders):
//   - message:        { id: <numeric>, type, content, created_at, avatar_url, portrait,
//                       character_name, user_id, username, _source: 'message' }
//   - handout_share:  { id: <share_uuid string>, type: 'handout_share', handout, user_id,
//                       username, avatar_url, created_at, _share_numeric_id, _source: 'handout' }
router.get('/:uuid/feed', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 50, 100);

    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }
    const campaignId = campaign.id;

    if (!(await isMember(campaignId, req.user.id))) {
      return res.status(403).json({ error: 'You are not a member of this campaign.' });
    }

    const beforeTs      = req.query.before_ts || null;
    // Sentinel 0: any real id is > 0, so "id < 0" excludes nothing from that table at the
    // boundary timestamp — safe when only one table has rows at the cursor timestamp.
    const beforeMsgId   = parseInt(req.query.before_msg_id)   || 0;
    const beforeShareId = parseInt(req.query.before_share_id) || 0;

    // The cursor predicate is applied per sub-table BEFORE the UNION so each branch can
    // use its own index. Strict < is used throughout to avoid re-fetching boundary items.
    const cursorClause = beforeTs ? `
      AND (
        %TS% < $3::TIMESTAMPTZ
        OR (%TS% = $3::TIMESTAMPTZ AND %ID% < %SID%)
      )` : '';

    const msgCursor   = cursorClause.replace(/%TS%/g, 'm.created_at').replace('%ID%', 'm.id').replace('%SID%', '$4');
    const shareCursor = cursorClause.replace(/%TS%/g, 'hs.shared_at').replace('%ID%', 'hs.id').replace('%SID%', '$5');

    const query = `
      SELECT
        m.id             AS source_id,
        m.id::TEXT       AS id,
        m.type           AS type,
        m.content        AS content,
        m.created_at     AS created_at,
        m.avatar_url     AS avatar_url,
        m.portrait       AS portrait,
        m.character_name AS character_name,
        m.image_urls     AS image_urls,
        m.user_id        AS user_id,
        u.username       AS username,
        NULL::TEXT       AS share_uuid,
        NULL::INTEGER    AS share_numeric_id,
        NULL::INTEGER    AS handout_numeric_id,
        NULL::TEXT       AS h_uuid,
        NULL::TEXT       AS h_title,
        NULL::TEXT       AS h_type,
        NULL::TEXT       AS h_content,
        NULL::TIMESTAMPTZ AS h_created_at,
        'message'        AS _source
      FROM messages m
      LEFT JOIN users u ON m.user_id = u.id
      WHERE m.campaign_id = $1${msgCursor}

      UNION ALL

      SELECT
        hs.id            AS source_id,
        hs.uuid::TEXT    AS id,
        'handout_share'  AS type,
        NULL             AS content,
        hs.shared_at     AS created_at,
        u.avatar_url     AS avatar_url,
        NULL             AS portrait,
        NULL             AS character_name,
        NULL::JSONB      AS image_urls,
        hs.shared_by     AS user_id,
        u.username       AS username,
        hs.uuid::TEXT    AS share_uuid,
        hs.id            AS share_numeric_id,
        h.id             AS handout_numeric_id,
        h.uuid           AS h_uuid,
        h.title          AS h_title,
        h.type           AS h_type,
        h.content        AS h_content,
        h.created_at     AS h_created_at,
        'handout'        AS _source
      FROM handout_shares hs
      JOIN users u    ON u.id = hs.shared_by
      JOIN handouts h ON h.id = hs.handout_id
      WHERE hs.campaign_id = $1${shareCursor}

      ORDER BY created_at DESC, source_id DESC
      LIMIT $2
    `;

    const params = beforeTs
      ? [campaignId, limit, beforeTs, beforeMsgId, beforeShareId]
      : [campaignId, limit];

    const result = await pool.query(query, params);

    // Map each raw row to its client-facing item shape. Handout-share rows need
    // buildHandout (which loads bundle sub-items) — buildHandout expects a row whose
    // `id` is the handout's numeric id, so we pass handout_numeric_id as `id`.
    const items = await Promise.all(result.rows.map(async (row) => {
      if (row._source === 'message') {
        return {
          id:             parseInt(row.id, 10), // numeric message id (cast back from TEXT)
          type:           row.type,
          content:        row.content,
          created_at:     row.created_at,
          avatar_url:     row.avatar_url,
          portrait:       row.portrait,
          character_name: row.character_name,
          image_urls:     row.image_urls || [],
          user_id:        row.user_id,
          username:       row.username,
          _source:        'message',
        };
      }
      const handout = await buildHandout({
        id:         row.handout_numeric_id,
        uuid:       row.h_uuid,
        title:      row.h_title,
        type:       row.h_type,
        content:    row.h_content,
        created_at: row.h_created_at,
      });
      return {
        id:               row.share_uuid, // UUID string — matches synthetic share shape
        type:             'handout_share',
        handout,
        user_id:          row.user_id,
        username:         row.username,
        avatar_url:       row.avatar_url,
        created_at:       row.created_at,
        _share_numeric_id: row.share_numeric_id,
        _source:          'handout',
      };
    }));

    // DB returns newest-first; reverse to oldest-first for the feed display.
    items.reverse();

    res.json({
      items,
      has_more: result.rows.length === limit,
    });
  } catch (err) {
    console.error('Get feed error:', err);
    res.status(500).json({ error: 'Failed to load feed.' });
  }
});

// ── DELETE /api/campaigns/:uuid/messages/:messageId ──────────
// Delete a message. Own message or keeper only.
router.delete('/:uuid/messages/:messageId', async (req, res) => {
  try {
    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });

    const memberRes = await pool.query(
      'SELECT role FROM campaign_members WHERE campaign_id = $1 AND user_id = $2',
      [campaign.id, req.user.id]
    );
    if (!memberRes.rows.length) return res.status(403).json({ error: 'Not a member.' });
    const callerIsKeeper = memberRes.rows[0].role === 'keeper';

    const msgRes = await pool.query(
      'SELECT * FROM messages WHERE id = $1 AND campaign_id = $2',
      [req.params.messageId, campaign.id]
    );
    if (!msgRes.rows.length) return res.status(404).json({ error: 'Message not found.' });
    const message = msgRes.rows[0];

    if (message.user_id !== req.user.id && !callerIsKeeper) {
      return res.status(403).json({ error: 'Cannot delete this message.' });
    }

    await pool.query('DELETE FROM messages WHERE id = $1', [message.id]);

    const io = req.app.get('io');
    io.to(`campaign:${campaign.id}`).emit('message:deleted', { id: message.id });

    res.status(204).send();
  } catch (err) {
    console.error('Delete message error:', err);
    res.status(500).json({ error: 'Failed to delete message.' });
  }
});

// ── POST /api/campaigns/:uuid/messages ───────────────────────
// Post a message via REST (Socket.io will use this internally too).
router.post('/:uuid/messages', async (req, res) => {
  try {
    const { content, type = 'chat' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required.' });
    }
    if (!['chat', 'roll', 'system'].includes(type)) {
      return res.status(400).json({ error: 'Invalid message type.' });
    }

    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }
    const campaignId = campaign.id;

    if (!(await isMember(campaignId, req.user.id))) {
      return res.status(403).json({ error: 'You are not a member of this campaign.' });
    }

    const result = await pool.query(
      `INSERT INTO messages (campaign_id, user_id, type, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, type, content, created_at`,
      [campaignId, req.user.id, type, content.trim()]
    );

    res.status(201).json({ message: result.rows[0] });
  } catch (err) {
    console.error('Post message error:', err);
    res.status(500).json({ error: 'Failed to post message.' });
  }
});

// ── PUT /api/campaigns/:uuid/character ───────────────────────
// Register or update the investigator a player is using.
// character_id: null = "decide later"
router.put('/:uuid/character', async (req, res) => {
  try {
    const { character_id } = req.body;

    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }
    const campaignId = campaign.id;

    if (!(await isMember(campaignId, req.user.id))) {
      return res.status(403).json({ error: 'Not a campaign member.' });
    }

    if (character_id) {
      const ownerCheck = await pool.query(
        'SELECT id FROM characters WHERE id = $1 AND user_id = $2',
        [character_id, req.user.id]
      );
      if (ownerCheck.rows.length === 0) {
        return res.status(403).json({ error: 'Character not found.' });
      }
    }

    await pool.query(
      `UPDATE campaign_members
       SET character_id = $1
       WHERE campaign_id = $2 AND user_id = $3`,
      [character_id || null, campaignId, req.user.id]
    );

    res.json({ message: 'Investigator registered.' });
  } catch (err) {
    console.error('Register character error:', err);
    res.status(500).json({ error: 'Failed to register investigator.' });
  }
});

// ── POST /api/campaigns/:uuid/roll/hidden ─────────────────────
// Rolls dice server-side and returns result WITHOUT broadcasting.
// Used when a player has "Hide Results" toggled on.
const { roll } = require('../utils/dice');

router.post('/:uuid/roll/hidden', async (req, res) => {
  try {
    const { notation, skillName, skillValue } = req.body;

    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }
    const campaignId = campaign.id;

    if (!(await isMember(campaignId, req.user.id))) {
      return res.status(403).json({ error: 'Not a campaign member.' });
    }

    const result = roll(notation, skillValue, skillName);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    // Save to DB (for history) but DON'T broadcast
    const dbResult = await pool.query(
      `INSERT INTO messages (campaign_id, user_id, type, content)
       VALUES ($1, $2, 'roll', $3)
       RETURNING id, type, content, created_at`,
      [campaignId, req.user.id, JSON.stringify(result)]
    );

    const [userRes, charRes] = await Promise.all([
      pool.query('SELECT avatar_url FROM users WHERE id=$1', [req.user.id]),
      pool.query(
        `SELECT c.portrait_data AS portrait
         FROM characters c
         JOIN campaign_members cm ON cm.character_id = c.id
         WHERE cm.campaign_id=$1 AND cm.user_id=$2 LIMIT 1`,
        [campaignId, req.user.id]
      ),
    ]);

    res.json({
      message: {
        ...dbResult.rows[0],
        user_id:    req.user.id,
        username:   req.user.username,
        avatar_url: userRes.rows[0]?.avatar_url || null,
        portrait:   charRes.rows[0]?.portrait   || null,
        content:    result,
      }
    });
  } catch (err) {
    console.error('Hidden roll error:', err);
    res.status(500).json({ error: 'Failed to roll.' });
  }
});

// ── PUT /api/campaigns/:uuid ──────────────────────────────────
// Edit campaign name/description. Keeper only. Broadcasts to room.
router.put('/:uuid', async (req, res) => {
  try {
    const { name, description } = req.body;

    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }
    const campaignId = campaign.id;

    if (!(await isKeeper(campaignId, req.user.id))) {
      return res.status(403).json({ error: 'Only the Keeper can edit this campaign.' });
    }
    if (!name?.trim()) {
      return res.status(400).json({ error: 'Campaign name is required.' });
    }

    const result = await pool.query(
      `UPDATE campaigns
       SET name = $1, description = $2, updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [name.trim(), description?.trim() || '', campaignId]
    );

    const io = req.app.get('io');
    if (io) {
      io.to('campaign:' + campaignId).emit('campaign_updated', {
        name:        result.rows[0].name,
        description: result.rows[0].description,
      });
    }

    res.json({ campaign: result.rows[0] });
  } catch (err) {
    console.error('Edit campaign error:', err);
    res.status(500).json({ error: 'Failed to update campaign.' });
  }
});

// ── DELETE /api/campaigns/:uuid/members/:userId ───────────────
// Remove a player from a campaign. Keeper only.
router.delete('/:uuid/members/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }
    const campaignId = campaign.id;

    if (!(await isKeeper(campaignId, req.user.id))) {
      return res.status(403).json({ error: 'Only the Keeper can remove members.' });
    }

    const targetRole = await pool.query(
      'SELECT role FROM campaign_members WHERE campaign_id=$1 AND user_id=$2',
      [campaignId, userId]
    );
    if (targetRole.rows[0]?.role === 'keeper') {
      return res.status(400).json({ error: "Can't remove the Keeper." });
    }

    await pool.query(
      'DELETE FROM campaign_members WHERE campaign_id=$1 AND user_id=$2',
      [campaignId, userId]
    );

    res.json({ message: 'Player removed.' });
  } catch (err) {
    console.error('Remove member error:', err);
    res.status(500).json({ error: 'Failed to remove player.' });
  }
});

module.exports = router;
