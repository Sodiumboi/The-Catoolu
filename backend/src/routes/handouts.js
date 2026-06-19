const express  = require('express');
const multer   = require('multer');
const pool     = require('../config/db');
const auth     = require('../middleware/auth');
const { uploadToR2, deleteFromR2 } = require('../utils/uploadToR2');
const quota = require('../utils/uploadQuota');

const mb = (b) => Math.round((b / (1024 * 1024)) * 10) / 10;

const router = express.Router();

const upload = multer({
  storage:    multer.memoryStorage(),
  limits:     { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Only images are allowed.'));
  },
});

// ── Helpers ───────────────────────────────────────────────────

async function getCampaignByUuid(uuid) {
  const res = await pool.query('SELECT * FROM campaigns WHERE uuid = $1', [uuid]);
  return res.rows[0] || null;
}

async function isKeeper(campaignId, userId) {
  const res = await pool.query(
    'SELECT role FROM campaign_members WHERE campaign_id = $1 AND user_id = $2',
    [campaignId, userId]
  );
  return res.rows[0]?.role === 'keeper';
}

async function isMember(campaignId, userId) {
  const res = await pool.query(
    'SELECT id FROM campaign_members WHERE campaign_id = $1 AND user_id = $2',
    [campaignId, userId]
  );
  return res.rows.length > 0;
}

// Recursively load bundle items up to maxDepth levels deep.
async function loadBundleItems(bundleId, depth = 0, maxDepth = 2) {
  const res = await pool.query(
    `SELECT h.uuid, h.title, h.type, h.content, h.created_at
     FROM handout_bundle_items hbi
     JOIN handouts h ON h.id = hbi.item_id
     WHERE hbi.bundle_id = $1
     ORDER BY hbi.position`,
    [bundleId]
  );

  const items = [];
  for (const row of res.rows) {
    if (row.type === 'bundle' && depth < maxDepth) {
      const subIdRes = await pool.query('SELECT id FROM handouts WHERE uuid = $1', [row.uuid]);
      row.items = await loadBundleItems(subIdRes.rows[0].id, depth + 1, maxDepth);
    }
    items.push(row);
  }
  return items;
}

// Build the full handout object (with items if bundle).
async function buildHandout(row) {
  const h = {
    uuid:       row.uuid,
    title:      row.title,
    type:       row.type,
    content:    row.content,
    created_at: row.created_at,
  };
  if (row.type === 'bundle') {
    h.items = await loadBundleItems(row.id);
  }
  return h;
}

// ── GET /api/campaigns/handouts/stats ────────────────────────
// Web-wide image upload count across all campaigns the user keeps.
router.get('/handouts/stats', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) FILTER (WHERE h.type = 'image') AS image_count,
              COUNT(*)                                  AS total_count
       FROM handouts h
       JOIN campaign_members cm ON cm.campaign_id = h.campaign_id
       WHERE cm.user_id = $1 AND cm.role = 'keeper'`,
      [req.user.id]
    );
    res.json({
      imageCount: parseInt(result.rows[0].image_count || 0),
      totalCount: parseInt(result.rows[0].total_count || 0),
    });
  } catch (err) {
    console.error('handouts stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats.' });
  }
});

// ── GET /api/campaigns/:uuid/handouts ─────────────────────────
// Full library for this campaign. Keeper only.
router.get('/:uuid/handouts', auth, async (req, res) => {
  try {
    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });
    if (!await isKeeper(campaign.id, req.user.id)) {
      return res.status(403).json({ error: 'Keeper only.' });
    }

    const result = await pool.query(
      `SELECT id, uuid, title, type, content, created_at
       FROM handouts WHERE campaign_id = $1 ORDER BY created_at`,
      [campaign.id]
    );

    const handouts = await Promise.all(result.rows.map(buildHandout));
    res.json(handouts);
  } catch (err) {
    console.error('handouts list error:', err);
    res.status(500).json({ error: 'Failed to fetch handouts.' });
  }
});

// ── POST /api/campaigns/:uuid/handouts ────────────────────────
// Create a new handout or bundle. Keeper only.
router.post('/:uuid/handouts', auth, upload.single('file'), async (req, res) => {
  try {
    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });
    if (!await isKeeper(campaign.id, req.user.id)) {
      return res.status(403).json({ error: 'Keeper only.' });
    }

    const { type, title = 'Untitled', content, items } = req.body;

    if (!['image', 'text', 'bundle'].includes(type)) {
      return res.status(400).json({ error: 'Invalid type.' });
    }

    let handoutContent = null;

    if (type === 'image') {
      if (!req.file) return res.status(400).json({ error: 'Image file required.' });
      const check = await quota.canUpload(req.user.id, req.file.size);
      if (!check.ok) {
        const msg = check.reason === 'total'
          ? `Storage full — used ${mb(check.quota.totalUsed)}MB of ${mb(check.quota.totalLimit)}MB. Delete files to free space.`
          : `Upload rate limit reached (${mb(check.quota.windowLimit)}MB per 5 min). Try again shortly.`;
        return res.status(429).json({ error: msg });
      }
      handoutContent = await uploadToR2(req.file.buffer, 'handouts', req.file.originalname);
    } else if (type === 'text') {
      handoutContent = content || '';
    }
    // bundle: content stays null

    const insertRes = await pool.query(
      `INSERT INTO handouts (campaign_id, created_by, title, type, content)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, uuid, title, type, content, created_at`,
      [campaign.id, req.user.id, title, type, handoutContent]
    );
    const handout = insertRes.rows[0];

    if (type === 'image' && req.file) {
      await quota.recordUpload(req.user.id, {
        url: handoutContent, size: req.file.size, kind: 'handout', campaignId: campaign.id,
      });
    }

    if (type === 'bundle' && Array.isArray(items) && items.length > 0) {
      for (let i = 0; i < items.length; i++) {
        const itemRes = await pool.query(
          'SELECT id FROM handouts WHERE uuid = $1 AND campaign_id = $2',
          [items[i], campaign.id]
        );
        if (itemRes.rows.length > 0) {
          await pool.query(
            'INSERT INTO handout_bundle_items (bundle_id, item_id, position) VALUES ($1, $2, $3)',
            [handout.id, itemRes.rows[0].id, i]
          );
        }
      }
    }

    res.status(201).json(await buildHandout(handout));
  } catch (err) {
    console.error('handouts create error:', err);
    res.status(500).json({ error: 'Failed to create handout.' });
  }
});

// ── PUT /api/campaigns/:uuid/handouts/:huuid ──────────────────
// Update title, content (text), or bundle membership. Keeper only.
router.put('/:uuid/handouts/:huuid', auth, async (req, res) => {
  try {
    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });
    if (!await isKeeper(campaign.id, req.user.id)) {
      return res.status(403).json({ error: 'Keeper only.' });
    }

    const handoutRes = await pool.query(
      'SELECT * FROM handouts WHERE uuid = $1 AND campaign_id = $2',
      [req.params.huuid, campaign.id]
    );
    if (!handoutRes.rows.length) return res.status(404).json({ error: 'Handout not found.' });
    const handout = handoutRes.rows[0];

    const { title, content, items } = req.body;

    await pool.query(
      `UPDATE handouts
       SET title      = COALESCE($1, title),
           content    = CASE WHEN $2::TEXT IS NOT NULL THEN $2 ELSE content END,
           updated_at = NOW()
       WHERE id = $3`,
      [title ?? null, handout.type === 'text' ? (content ?? null) : null, handout.id]
    );

    if (handout.type === 'bundle' && Array.isArray(items)) {
      await pool.query('DELETE FROM handout_bundle_items WHERE bundle_id = $1', [handout.id]);
      for (let i = 0; i < items.length; i++) {
        const itemRes = await pool.query(
          'SELECT id FROM handouts WHERE uuid = $1 AND campaign_id = $2',
          [items[i], campaign.id]
        );
        if (itemRes.rows.length > 0) {
          await pool.query(
            'INSERT INTO handout_bundle_items (bundle_id, item_id, position) VALUES ($1, $2, $3)',
            [handout.id, itemRes.rows[0].id, i]
          );
        }
      }
    }

    const updated = await pool.query(
      'SELECT id, uuid, title, type, content, created_at FROM handouts WHERE id = $1',
      [handout.id]
    );
    res.json(await buildHandout(updated.rows[0]));
  } catch (err) {
    console.error('handouts update error:', err);
    res.status(500).json({ error: 'Failed to update handout.' });
  }
});

// ── DELETE /api/campaigns/:uuid/handouts/:huuid ───────────────
// Delete a handout or bundle. Keeper only.
router.delete('/:uuid/handouts/:huuid', auth, async (req, res) => {
  try {
    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });
    if (!await isKeeper(campaign.id, req.user.id)) {
      return res.status(403).json({ error: 'Keeper only.' });
    }

    const handoutRes = await pool.query(
      'SELECT * FROM handouts WHERE uuid = $1 AND campaign_id = $2',
      [req.params.huuid, campaign.id]
    );
    if (!handoutRes.rows.length) return res.status(404).json({ error: 'Handout not found.' });
    const handout = handoutRes.rows[0];

    // Remove from any bundles it belongs to (individual handouts only)
    if (handout.type !== 'bundle') {
      await pool.query('DELETE FROM handout_bundle_items WHERE item_id = $1', [handout.id]);
    }

    // Delete R2 file for images + stop counting it against the uploader's quota
    if (handout.type === 'image' && handout.content) {
      try { await deleteFromR2(handout.content); } catch (e) {
        console.error('R2 delete failed (continuing):', e.message);
      }
      await quota.untrackByUrl(handout.content);
    }

    await pool.query('DELETE FROM handouts WHERE id = $1', [handout.id]);
    res.status(204).send();
  } catch (err) {
    console.error('handouts delete error:', err);
    res.status(500).json({ error: 'Failed to delete handout.' });
  }
});

// ── POST /api/campaigns/:uuid/handouts/:huuid/share ───────────
// Keeper shares a handout into chat. Keeper only.
router.post('/:uuid/handouts/:huuid/share', auth, async (req, res) => {
  try {
    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });
    if (!await isKeeper(campaign.id, req.user.id)) {
      return res.status(403).json({ error: 'Keeper only.' });
    }

    const handoutRes = await pool.query(
      'SELECT * FROM handouts WHERE uuid = $1 AND campaign_id = $2',
      [req.params.huuid, campaign.id]
    );
    if (!handoutRes.rows.length) return res.status(404).json({ error: 'Handout not found.' });
    const handout = handoutRes.rows[0];

    const shareRes = await pool.query(
      `INSERT INTO handout_shares (handout_id, campaign_id, shared_by)
       VALUES ($1, $2, $3)
       RETURNING uuid, shared_at`,
      [handout.id, campaign.id, req.user.id]
    );
    const share = shareRes.rows[0];

    const userRes = await pool.query('SELECT username, avatar_url FROM users WHERE id = $1', [req.user.id]);
    const keeperUsername  = userRes.rows[0]?.username  || 'Keeper';
    const keeperAvatarUrl = userRes.rows[0]?.avatar_url || null;

    const handoutPayload = await buildHandout(handout);

    const io = req.app.get('io');
    io.to(`campaign:${campaign.id}`).emit('handout:shared', {
      share_uuid:   share.uuid,
      handout:      handoutPayload,
      shared_by:    keeperUsername,
      shared_by_id: req.user.id,
      avatar_url:   keeperAvatarUrl,
      shared_at:    share.shared_at,
    });

    res.status(201).json({
      share_uuid: share.uuid,
      shared_at:  share.shared_at,
      shared_by:  keeperUsername,
      handout:    handoutPayload,
    });
  } catch (err) {
    console.error('handouts share error:', err);
    res.status(500).json({ error: 'Failed to share handout.' });
  }
});

// ── DELETE /api/campaigns/:uuid/handouts/shares/:shareUuid ────
// Remove a handout share from the chat feed. Keeper only.
router.delete('/:uuid/handouts/shares/:shareUuid', auth, async (req, res) => {
  try {
    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });
    if (!await isKeeper(campaign.id, req.user.id)) {
      return res.status(403).json({ error: 'Keeper only.' });
    }

    const shareRes = await pool.query(
      'SELECT id FROM handout_shares WHERE uuid = $1 AND campaign_id = $2',
      [req.params.shareUuid, campaign.id]
    );
    if (!shareRes.rows.length) return res.status(404).json({ error: 'Share not found.' });

    await pool.query('DELETE FROM handout_shares WHERE id = $1', [shareRes.rows[0].id]);

    const io = req.app.get('io');
    io.to(`campaign:${campaign.id}`).emit('message:deleted', { id: req.params.shareUuid });

    res.status(204).send();
  } catch (err) {
    console.error('Delete share error:', err);
    res.status(500).json({ error: 'Failed to delete share.' });
  }
});

// ── GET /api/campaigns/:uuid/handouts/shared ──────────────────
// History of all shared handouts. All campaign members.
router.get('/:uuid/handouts/shared', auth, async (req, res) => {
  try {
    const campaign = await getCampaignByUuid(req.params.uuid);
    if (!campaign) return res.status(404).json({ error: 'Campaign not found.' });
    if (!await isMember(campaign.id, req.user.id)) {
      return res.status(403).json({ error: 'Not a campaign member.' });
    }

    const result = await pool.query(
      `SELECT hs.uuid AS share_uuid, hs.shared_at, hs.shared_by AS shared_by_id,
              u.username AS shared_by, u.avatar_url,
              h.id, h.uuid, h.title, h.type, h.content, h.created_at
       FROM handout_shares hs
       JOIN handouts h ON h.id = hs.handout_id
       JOIN users u ON u.id = hs.shared_by
       WHERE hs.campaign_id = $1
       ORDER BY hs.shared_at ASC`,
      [campaign.id]
    );

    const shares = await Promise.all(result.rows.map(async (row) => ({
      share_uuid:   row.share_uuid,
      shared_at:    row.shared_at,
      shared_by:    row.shared_by,
      shared_by_id: row.shared_by_id,
      avatar_url:   row.avatar_url,
      handout:      await buildHandout(row),
    })));

    res.json(shares);
  } catch (err) {
    console.error('handouts shared history error:', err);
    res.status(500).json({ error: 'Failed to fetch shared handouts.' });
  }
});

module.exports = router;
