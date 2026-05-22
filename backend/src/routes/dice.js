const express = require('express');
const router  = express.Router();
const auth    = require('../middleware/auth');
const { roll } = require('../utils/dice');

// All dice routes require authentication
router.use(auth);

// ── POST /api/dice/test ───────────────────────────────────────
// Roll dice N times for fairness testing.
// Does NOT save to DB, does NOT broadcast to any room.
// Returns an array of raw roll results.
//
// Body: { notation: '1d20', count: 500 }
// Returns: { rolls: [14, 3, 8, ...], sides: 20, count: 500 }
router.post('/test', async (req, res) => {
  try {
    const { notation, count } = req.body;

    if (!notation) {
      return res.status(400).json({ error: 'notation is required.' });
    }

    const n = Math.min(parseInt(count) || 100, 2000); // cap at 2000
    if (n < 1) {
      return res.status(400).json({ error: 'count must be at least 1.' });
    }

    // Extract sides from notation (e.g. '1d20' → 20)
    const match = notation.match(/d(\d+)/i);
    if (!match) {
      return res.status(400).json({ error: 'Invalid notation.' });
    }
    const sides = parseInt(match[1]);

    // Roll N times — pure crypto.randomInt(), no DB, no socket
    const rolls = [];
    for (let i = 0; i < n; i++) {
      const result = roll(notation);
      if (result.error) {
        return res.status(400).json({ error: result.error });
      }
      rolls.push(result.total);
    }

    res.json({ rolls, sides, count: n });
  } catch (err) {
    console.error('Dice test error:', err);
    res.status(500).json({ error: 'Failed to run dice test.' });
  }
});

module.exports = router;