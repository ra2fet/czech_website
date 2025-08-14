// middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token. Please log in again.' });
    }

    // Verify user exists in database
    db.query('SELECT id FROM admins WHERE id = ?', [user.id], (err, results) => {
      if (err || results.length === 0) {
        return res.status(403).json({ error: 'User not found. Please log in again.' });
      }

      req.user = user;
      next();
    });
  });
};

module.exports = authenticateToken;