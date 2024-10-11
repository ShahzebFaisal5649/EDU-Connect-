// server/middleware/auth.js
const User = require('../models/User');

/**
 * Middleware to check if the user is an admin.
 * Expects 'user-id' in request headers.
 */
// server/middleware/auth.js

const isAdmin = (req, res, next) => {
  try {
    const { role } = req.body.user || req.user; // Assuming the role is sent via body or user

    if (role === 'admin') {
      next(); // Proceed if the user is an admin
    } else {
      return res.status(403).json({ message: 'Forbidden: You do not have the correct permissions.' });
    }
  } catch (error) {
    return res.status(403).json({ message: 'Forbidden: Invalid authentication.' });
  }
};

module.exports = { isAdmin };