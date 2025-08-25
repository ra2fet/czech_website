// middleware/auth.js
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  console.log('Auth Middleware: Received request for path:', req.path);
  console.log('Auth Middleware: Authorization Header:', authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('Auth Middleware: No valid Authorization header found. Denying access.');
    return res.status(401).json({ error: 'Access denied. No authentication token provided.' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      console.log('Auth Middleware: JWT verification failed. Error:', err.message);
      return res.status(403).json({ error: 'Invalid token. Please log in again.' });
    }

    // Verify user exists in database (if they are in the admins table, they are an admin)
    db.query('SELECT id FROM admins WHERE id = ?', [user.id], (err, results) => {
      if (err) {
        console.error('Auth Middleware: Database error during user verification:', err);
        return res.status(500).json({ error: 'Database error during authentication.' });
      }
      if (results.length === 0) {
        console.log('Auth Middleware: User not found in admins table for ID:', user.id);
        return res.status(403).json({ error: 'User not found or not an admin. Please log in again.' });
      }

      req.user = user; // Attach user object to request
      console.log('Auth Middleware: User authenticated and found in admins table. User ID:', user.id);
      next();
    });
  });
};

const adminProtect = (req, res, next) => {
  // If authenticateToken successfully ran, req.user will be populated, meaning the user is an admin.
  if (!req.user) {
    console.log('Auth Middleware: Admin access denied. User not authenticated as admin.');
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  console.log('Auth Middleware: Admin access granted for user ID:', req.user.id);
  next();
};

module.exports = { authenticateToken, adminProtect };
