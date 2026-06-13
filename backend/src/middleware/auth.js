// ============================================================
// JWT Authentication Middleware
//
// This function runs BEFORE any protected route handler.
// It checks the request for a valid token and, if valid,
// attaches the user's info to the request object.
// ============================================================

const jwt = require('jsonwebtoken');
require('dotenv').config();

const auth = (req, res, next) => {

  // Tokens are sent in the HTTP header like:
  // Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  const authHeader = req.headers['authorization'];

  if (!authHeader) {
    return res.status(401).json({
      error: 'No token provided. Please log in.'
    });
  }

  // Split "Bearer <token>" to get just the token part
  const token = authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      error: 'Token format invalid. Expected: Bearer <token>'
    });
  }

  try {
    // jwt.verify() both decodes the token AND checks it hasn't been tampered with
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user info to the request — route handlers can read req.user
    req.user = {
      id:       decoded.id,
      username: decoded.username,
      email:    decoded.email,
      is_admin: decoded.is_admin || false,
    };

    next(); // ✅ Token is valid — pass control to the actual route handler

  } catch (err) {
    // Token is expired, fake, or corrupted
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Session expired. Please log in again.' });
    }
    return res.status(403).json({ error: 'Invalid token. Please log in again.' });
  }
};

module.exports = auth;
