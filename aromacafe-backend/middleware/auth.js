const jwt = require('jsonwebtoken');

// Protects a route: requires a valid "Authorization: Bearer <token>" header.
// On success, attaches req.userId so route handlers know who's calling.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Not logged in.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Session expired, please log in again.' });
  }
}

module.exports = requireAuth;
