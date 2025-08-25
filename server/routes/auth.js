// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const router = express.Router();


router.post('/register-admin', async (req, res) => {
  const { email, password } = req.body;
  try {
    // Check if admin already exists
    db.query('SELECT * FROM admins WHERE email = ?', [email], async (err, results) => {
      if (err) return res.status(500).json({ error: 'Database error' });
      if (results.length > 0) return res.status(400).json({ error: 'Admin already exists' });

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      db.query(
        'INSERT INTO admins (email, password) VALUES (?, ?)',
        [email, hashedPassword],
        (err, result) => {
          if (err) return res.status(500).json({ error: `Failed to register admin ${err}` });
          res.status(201).json({ message: 'Admin registered successfully' });
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
  const { fullName, phoneNumber, email, password, userType, companyName, licenseNumber } = req.body;

  // Basic validation
  if (!fullName || !phoneNumber || !email || !password || !userType) {
    return res.status(400).json({ error: 'All required fields must be provided.' });
  }

  if (userType === 'company' && (!companyName || !licenseNumber)) {
    return res.status(400).json({ error: 'Company name and license number are required for company registration.' });
  }

  try {
    // Check if user already exists
    db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
      if (err) {
        console.error('Database error during user check:', err);
        return res.status(500).json({ error: 'Database error' });
      }
      if (results.length > 0) {
        return res.status(400).json({ error: 'User with this email already exists.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);
      const isActive = userType === 'customer' ? true : false; // Companies require admin approval

      db.query(
        'INSERT INTO users (full_name, phone_number, email, password, user_type, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [fullName, phoneNumber, email, hashedPassword, userType, isActive],
        (err, result) => {
          if (err) {
            console.error('Database error during user registration:', err);
            return res.status(500).json({ error: `Failed to register user: ${err.message}` });
          }

          const userId = result.insertId;

          if (userType === 'company') {
            db.query(
              'INSERT INTO companies (user_id, company_name, license_number) VALUES (?, ?, ?)',
              [userId, companyName, licenseNumber],
              (err) => {
                if (err) {
                  console.error('Database error during company registration:', err);
                  // Rollback user creation if company creation fails
                  db.query('DELETE FROM users WHERE id = ?', [userId], () => {
                    return res.status(500).json({ error: `Failed to register company: ${err.message}` });
                  });
                  return;
                }
                res.status(201).json({ message: 'Company registered successfully. Awaiting admin approval.' });
              }
            );
          } else {
            res.status(201).json({ message: 'Customer registered successfully.' });
          }
        }
      );
    });
  } catch (error) {
    console.error('Server error during registration:', error);
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
    // Try to find user in 'admins' table
    db.query('SELECT id, email, password, "admin" as user_type, TRUE as is_active FROM admins WHERE email = ?', [email], async (err, adminResults) => {
      if (err) {
        console.error('Database error (admins table):', err);
        return res.status(500).json({ error: 'Database error' });
      }

      let user = null;
      let userSource = null;

      if (adminResults.length > 0) {
        user = adminResults[0];
        userSource = 'admin';
      } else {
        // If not found in 'admins', try 'users' table
        db.query('SELECT id, full_name, email, password, user_type, is_active FROM users WHERE email = ?', [email], async (err, userResults) => {
          if (err) {
            console.error('Database error (users table):', err);
            return res.status(500).json({ error: 'Database error' });
          }

          if (userResults.length > 0) {
            user = userResults[0];
            userSource = 'user';
          }

          if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
          }

          // Check if company account is active
          if (userSource === 'user' && user.user_type === 'company' && !user.is_active) {
            return res.status(403).json({ error: 'Your company account is awaiting admin approval.' });
          }

          // Check for JWT_SECRET
          if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined');
            return res.status(500).json({ error: 'Server configuration error' });
          }

          // Generate JWT token with user type and active status
          const token = jwt.sign(
            { id: user.id, email: user.email, userType: user.user_type, isActive: user.is_active },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
          );

          // Return token and user info
          res.json({
            token,
            user: { id: user.id, email: user.email, userType: user.user_type, isActive: user.is_active },
          });
        });
      }

      // If user was found in admins table, process here
      if (userSource === 'admin') {
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!process.env.JWT_SECRET) {
          console.error('JWT_SECRET is not defined');
          return res.status(500).json({ error: 'Server configuration error' });
        }

        const token = jwt.sign(
          { id: user.id, email: user.email, userType: user.user_type, isActive: user.is_active },
          process.env.JWT_SECRET,
          { expiresIn: '1h' }
        );

        res.json({
          token,
          user: { id: user.id, email: user.email, userType: user.user_type, isActive: user.is_active },
        });
      }
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

router.get('/user', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'Token format is "Bearer <token>"' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // The decoded token already contains userType and isActive
    res.json({ id: decoded.id, email: decoded.email, userType: decoded.userType, isActive: decoded.isActive });
  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
