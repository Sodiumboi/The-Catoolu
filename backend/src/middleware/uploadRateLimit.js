// Per-user upload rate limiter — in-memory, no external dependency.
// Tracks upload timestamps per user within a sliding 60-second window.

const LIMIT      = 20;
const WINDOW_MS  = 60 * 1000;

const history = new Map(); // userId -> number[] (timestamps)

function prune(userId) {
  const now  = Date.now();
  const prev = history.get(userId) || [];
  const next = prev.filter(t => now - t < WINDOW_MS);
  history.set(userId, next);
  return next;
}

function getUsage(userId) {
  const timestamps = prune(userId);
  const oldest     = timestamps[0] ?? null;
  const resetIn    = oldest ? Math.max(0, WINDOW_MS - (Date.now() - oldest)) : 0;
  return { used: timestamps.length, limit: LIMIT, resetIn };
}

function recordUpload(userId) {
  const timestamps = prune(userId);
  timestamps.push(Date.now());
  history.set(userId, timestamps);
}

function uploadRateLimit(req, res, next) {
  const { used } = getUsage(req.user.id);
  if (used >= LIMIT) {
    return res.status(429).json({
      error: `Upload limit reached (${LIMIT} per minute). Try again shortly.`,
    });
  }
  recordUpload(req.user.id);
  next();
}

module.exports = { uploadRateLimit, getUsage };
