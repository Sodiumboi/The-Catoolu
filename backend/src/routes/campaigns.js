const express = require('express');
const router  = express.Router();
const pool    = require('../config/db');
const auth    = require('../middleware/auth');

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

// Check if user is the keeper of a campaign
async function isKeeper(campaignId, userId) {
  const res = await pool.query(
    `SELECT role FROM campaign_members
     WHERE campaign_id = $1 AND user_id = $2`,
    [campaignId, userId]
  );
  return res.rows[0]?.role === 'keeper';
}

// Check if user is a member of a campaign
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

    const invite_code = await getUniqueInviteCode();

    // Create the campaign
    const campaignRes = await pool.query(
      `INSERT INTO campaigns (name, description, keeper_id, invite_code)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name.trim(), description.trim(), req.user.id, invite_code]
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
// MUST be before /:id routes — otherwise Express matches /join as an id.
router.post('/join', async (req, res) => {
  try {
    const { invite_code } = req.body;

    if (!invite_code) {
      return res.status(400).json({ error: 'Invite code is required.' });
    }

    // Find the campaign
    const campaignRes = await pool.query(
      'SELECT * FROM campaigns WHERE invite_code = $1',
      [invite_code.trim().toUpperCase()]
    );
    if (campaignRes.rows.length === 0) {
      return res.status(404).json({ error: 'Invalid invite code. Check the code and try again.' });
    }
    const campaign = campaignRes.rows[0];

    // Check if already a member
    if (await isMember(campaign.id, req.user.id)) {
      return res.status(409).json({ error: 'You are already a member of this campaign.' });
    }

    // Add as player
    await pool.query(
      `INSERT INTO campaign_members (campaign_id, user_id, role)
       VALUES ($1, $2, 'player')`,
      [campaign.id, req.user.id]
    );

    // System message
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
         c.name,
         c.description,
         c.invite_code,
         c.keeper_id,
         c.created_at,
         c.updated_at,
         cm.role,
         -- Count members in this campaign
         (SELECT COUNT(*) FROM campaign_members
          WHERE campaign_id = c.id) AS member_count,
         -- Get the keeper's username
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

// ── GET /api/campaigns/:id ────────────────────────────────────
// Get one campaign with its full member list.
// Only accessible to campaign members.
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Verify membership
    if (!(await isMember(id, req.user.id))) {
      return res.status(403).json({ error: 'You are not a member of this campaign.' });
    }

    // Get campaign details
    const campaignRes = await pool.query(
      `SELECT c.*, cm.role AS my_role,
              (SELECT username FROM users WHERE id = c.keeper_id) AS keeper_name
       FROM campaigns c
       JOIN campaign_members cm ON c.id = cm.campaign_id
       WHERE c.id = $1 AND cm.user_id = $2`,
      [id, req.user.id]
    );
    if (campaignRes.rows.length === 0) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }
    const campaign = campaignRes.rows[0];

    // Get all members with their usernames
    const membersRes = await pool.query(
      `SELECT
         u.id,
         u.username,
         u.avatar_url,
         cm.role,
         cm.joined_at,
         cm.character_id,
         (
           SELECT sheet_data->'Investigator'->'PersonalDetails'->>'Name'
           FROM characters
           WHERE id = cm.character_id
         ) AS character_name,
         (
           SELECT sheet_data->'Investigator'->'PersonalDetails'->>'Occupation'
           FROM characters
           WHERE id = cm.character_id
         ) AS character_occupation
       FROM campaign_members cm
       JOIN users u ON cm.user_id = u.id
       WHERE cm.campaign_id = $1
       ORDER BY cm.role DESC, cm.joined_at ASC`,
      // DESC so 'keeper' sorts before 'player' alphabetically
      [id]
    );

    res.json({
      campaign: {
        ...campaign,
        members: membersRes.rows,
      }
    });
  } catch (err) {
    console.error('Get campaign error:', err);
    res.status(500).json({ error: 'Failed to load campaign.' });
  }
});

// ── DELETE /api/campaigns/:id/leave ──────────────────────────
// Leave a campaign. Keepers cannot leave (they must delete instead).
router.delete('/:id/leave', async (req, res) => {
  try {
    const { id } = req.params;

    if (!(await isMember(id, req.user.id))) {
      return res.status(403).json({ error: 'You are not a member of this campaign.' });
    }

    if (await isKeeper(id, req.user.id)) {
      return res.status(400).json({
        error: 'Keepers cannot leave their own campaign. Delete the campaign instead.'
      });
    }

    await pool.query(
      'DELETE FROM campaign_members WHERE campaign_id = $1 AND user_id = $2',
      [id, req.user.id]
    );

    // System message
    await pool.query(
      `INSERT INTO messages (campaign_id, user_id, type, content)
       VALUES ($1, NULL, 'system', $2)`,
      [id, `${req.user.username} left the investigation.`]
    );

    res.json({ message: 'Left campaign successfully.' });
  } catch (err) {
    console.error('Leave campaign error:', err);
    res.status(500).json({ error: 'Failed to leave campaign.' });
  }
});

// ── DELETE /api/campaigns/:id ─────────────────────────────────
// Delete a campaign entirely. Keeper only.
// ON DELETE CASCADE in the schema handles members + messages.
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!(await isKeeper(id, req.user.id))) {
      return res.status(403).json({ error: 'Only the Keeper can delete a campaign.' });
    }

    await pool.query('DELETE FROM campaigns WHERE id = $1', [id]);

    res.json({ message: 'Campaign deleted.' });
  } catch (err) {
    console.error('Delete campaign error:', err);
    res.status(500).json({ error: 'Failed to delete campaign.' });
  }
});

// ── GET /api/campaigns/:id/messages ──────────────────────────
// Fetch message history for a campaign. Members only.
// Paginated: ?limit=50&before=<message_id>
router.get('/:id/messages', async (req, res) => {
  try {
    const { id }              = req.params;
    const limit               = Math.min(parseInt(req.query.limit) || 50, 100);
    const before              = req.query.before; // message id cursor

    if (!(await isMember(id, req.user.id))) {
      return res.status(403).json({ error: 'You are not a member of this campaign.' });
    }

    // Build paginated query
    // If 'before' cursor is provided, fetch messages older than that id
    let query;
    let params;

    if (before) {
      query = `
        SELECT m.id, m.type, m.content, m.created_at,
               u.id AS user_id, u.username
        FROM messages m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.campaign_id = $1 AND m.id < $2
        ORDER BY m.created_at DESC
        LIMIT $3
      `;
      params = [id, before, limit];
    } else {
      query = `
        SELECT m.id, m.type, m.content, m.created_at,
               u.id AS user_id, u.username
        FROM messages m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.campaign_id = $1
        ORDER BY m.created_at DESC
        LIMIT $2
      `;
      params = [id, limit];
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

// ── POST /api/campaigns/:id/messages ─────────────────────────
// Post a message via REST (Socket.io will use this internally too).
router.post('/:id/messages', async (req, res) => {
  try {
    const { id }             = req.params;
    const { content, type = 'chat' } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ error: 'Message content is required.' });
    }
    if (!['chat', 'roll', 'system'].includes(type)) {
      return res.status(400).json({ error: 'Invalid message type.' });
    }
    if (!(await isMember(id, req.user.id))) {
      return res.status(403).json({ error: 'You are not a member of this campaign.' });
    }

    const result = await pool.query(
      `INSERT INTO messages (campaign_id, user_id, type, content)
       VALUES ($1, $2, $3, $4)
       RETURNING id, type, content, created_at`,
      [id, req.user.id, type, content.trim()]
    );

    res.status(201).json({ message: result.rows[0] });
  } catch (err) {
    console.error('Post message error:', err);
    res.status(500).json({ error: 'Failed to post message.' });
  }
});

// ── PUT /api/campaigns/:id/character ─────────────────────────
// Register or update the investigator a player is using.
// character_id: null = "decide later"
router.put('/:id/character', async (req, res) => {
  try {
    const { character_id } = req.body;
    const campaignId       = req.params.id;

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

module.exports = router;
