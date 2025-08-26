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

    // Check if the user is an admin
    db.query('SELECT id, email FROM admins WHERE id = ?', [user.id], (err, adminResults) => {
      if (err) {
        console.error('Auth Middleware: Database error during admin verification:', err);
        return res.status(500).json({ error: 'Database error during authentication.' });
      }

      if (adminResults.length > 0) {
        // User is an admin
        req.user = { id: adminResults[0].id, email: adminResults[0].email, userType: 'admin' };
        console.log('Auth Middleware: User authenticated as admin. User ID:', req.user.id);
        return next();
      }

      // If not an admin, check if they are a regular user
      db.query('SELECT id, email, user_type FROM users WHERE id = ?', [user.id], (err, userResults) => {
        if (err) {
          console.error('Auth Middleware: Database error during user verification:', err);
          return res.status(500).json({ error: 'Database error during authentication.' });
        }

        if (userResults.length === 0) {
          console.log('Auth Middleware: User not found in either admins or users table for ID:', user.id);
          return res.status(403).json({ error: 'User not found. Please log in again.' });
        }

        // User is a regular user
        req.user = { id: userResults[0].id, email: userResults[0].email, userType: userResults[0].user_type };
        console.log('Auth Middleware: User authenticated as regular user. User ID:', req.user.id, 'User Type:', req.user.userType);
        next();
      });
    });
  });
};

const adminProtect = (req, res, next) => {
  // Ensure user is authenticated and has admin privileges
  if (!req.user || req.user.userType !== 'admin') {
    console.log('Auth Middleware: Admin access denied. User not authenticated as admin or lacks privileges.');
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  console.log('Auth Middleware: Admin access granted for user ID:', req.user.id);
  next();
};

module.exports = { authenticateToken, adminProtect };
