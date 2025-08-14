// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();


router.post('/register', async (req, res) => {
  const { email, password } = req.body;  try {
    // Check if user already exists
    db.query('SELECT * FROM admins WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results.length > 0) return res.status(400).json({ error: 'User already exists' });  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);
  db.query(
    'INSERT INTO admins (email, password) VALUES (?, ?)',
    [email, hashedPassword],
    (err, result) => {
      if (err) return res.status(500).json({ error: `Failed to register user ${err}` });
      res.status(201).json({ message: 'User registered successfully' });
    }
  );
});  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});



router.post('/signin', async (req, res) => {
  const { email, password } = req.body || {};

  // Validate input
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    // Query the database for the user
    db.query('SELECT * FROM admins WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (results.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const user = results[0];

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Check for JWT_SECRET
      if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not defined');
        return res.status(500).json({ error: 'Server configuration error' });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '30m' }
      );

      // Return token and user info
      res.json({
        token,
        user: { id: user.id, email: user.email },
      });
    });
  } catch (error) {
    console.error('Sign-in error:', error);
    res.status(500).json({ error: 'An unexpected error occurred during sign-in' });
  }
});

router.post('/signout', (req, res) => {
  // Since JWT is stateless, signout is handled client-side by removing the token
  res.json({ message: 'Signed out successfully. Please remove the token from client storage.' });
});

module.exports = router;