// Per-user limiter for password *verification* attempts — in-memory, same
// shape as uploadRateLimit.js, no external dependency.
//
// Why this exists: POST /profile/verify-password answers "is this the correct
// password?" without changing anything. That is a credential oracle. It sits
// behind JWT auth, so an attacker needs the user's session already — but a
// stolen session should not also become a way to confirm a guessed password
// (which the user has likely reused elsewhere). Cap the guess rate so the
// endpoint is useful for a typo and useless for a search.
//
// Counts every attempt, not just failures: a limiter that only counts misses
// lets an attacker reset their budget with one known-good guess.

const LIMIT     = 10;
const WINDOW_MS = 5 * 60 * 1000;

const history = new Map(); // userId -> number[] (timestamps)

function prune(userId) {
  const now  = Date.now();
  const next = (history.get(userId) || []).filter(t => now - t < WINDOW_MS);
  history.set(userId, next);
  return next;
}

function passwordAttemptLimit(req, res, next) {
  const attempts = prune(req.user.id);
  if (attempts.length >= LIMIT) {
    const retryMs = WINDOW_MS - (Date.now() - attempts[0]);
    return res.status(429).json({
      error: `Too many password attempts. Try again in ${Math.ceil(retryMs / 60000)} minute(s).`,
    });
  }
  attempts.push(Date.now());
  history.set(req.user.id, attempts);
  next();
}

module.exports = { passwordAttemptLimit };
