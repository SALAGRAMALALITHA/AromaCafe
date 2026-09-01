const User = require('../models/User');

// Must run AFTER requireAuth (needs req.userId already set).
// Blocks the request unless the logged-in user has role: 'admin'.
async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access only.' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: 'Something went wrong.' });
  }
}

module.exports = requireAdmin;
