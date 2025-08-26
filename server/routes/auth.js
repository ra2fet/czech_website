// routes/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const emailService = require('../utils/emailService'); // Import email service

const router = express.Router();

// Function to generate a random 6-digit verification code
const generateVerificationCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};


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
      let isActive = userType === 'customer' ? false : false; // Default to false for all, then adjust based on type
      let isVerified = userType === 'customer' ? false : true; // Companies are verified by default, customers need email verification
      let verificationCode = null;

      if (userType === 'customer') {
        verificationCode = generateVerificationCode();
      } else if (userType === 'company') {
        isActive = false; // Companies still require admin approval
      }

      db.query(
        'INSERT INTO users (full_name, phone_number, email, password, user_type, is_active, verification_code, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [fullName, phoneNumber, email, hashedPassword, userType, isActive, verificationCode, isVerified],
        async (err, result) => {
          if (err) {
            console.error('Database error during user registration:', err);
            return res.status(500).json({ error: `Failed to register user: ${err.message}` });
          }

          const userId = result.insertId;

          if (userType === 'customer') {
            // Send verification email only for customers
            try {
              await emailService.sendVerificationEmail(email, verificationCode);
            } catch (emailError) {
              console.error('Error sending verification email:', emailError);
              // Optionally, rollback user creation or mark for manual review if email sending fails
              return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
            }
            res.status(201).json({ message: 'Customer registered successfully. Please check your email to verify your account.' });
          } else if (userType === 'company') {
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
        db.query('SELECT id, full_name, email, password, user_type, is_active, is_verified, verification_code FROM users WHERE email = ?', [email], async (err, userResults) => {
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

          // Check if customer account is verified
          if (userSource === 'user' && user.user_type === 'customer' && !user.is_verified) {
            return res.status(403).json({ error: 'Please verify your email address to sign in.' });
          }

          // Check if company account is active (only for companies)
          if (userSource === 'user' && user.user_type === 'company' && !user.is_active) {
            return res.status(403).json({ error: 'Your company account is awaiting admin approval.' });
          }

          // Check for JWT_SECRET
          if (!process.env.JWT_SECRET) {
            console.error('JWT_SECRET is not defined');
            return res.status(500).json({ error: 'Server configuration error' });
          }

          // Generate JWT token with user type, active status, and verified status
          const token = jwt.sign(
            { id: user.id, email: user.email, userType: user.user_type, isActive: user.is_active, isVerified: user.is_verified },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
          );

          // Return token and user info
          res.json({
            token,
            user: { id: user.id, email: user.email, userType: user.user_type, isActive: user.is_active, isVerified: user.is_verified },
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

router.post('/verify-email', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Email and verification code are required.' });
  }

  try {
    db.query('SELECT * FROM users WHERE email = ? AND verification_code = ? AND user_type = "customer"', [email, code], (err, results) => {
      if (err) {
        console.error('Database error during email verification:', err);
        return res.status(500).json({ error: 'Database error.' });
      }

      if (results.length === 0) {
        return res.status(400).json({ error: 'Invalid email or verification code.' });
      }

      // User found, update is_verified status and clear verification code
      db.query(
        'UPDATE users SET is_verified = TRUE, verification_code = NULL WHERE email = ? AND user_type = "customer"',
        [email],
        (updateErr) => {
          if (updateErr) {
            console.error('Database error updating verification status:', updateErr);
            return res.status(500).json({ error: 'Failed to verify email.' });
          }
          res.status(200).json({ message: 'Email verified successfully. You can now sign in.' });
        }
      );
    });
  } catch (error) {
    console.error('Server error during email verification:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

router.post('/resend-verification-code', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' });
  }

  try {
    db.query('SELECT * FROM users WHERE email = ? AND user_type = "customer"', [email], async (err, results) => {
      if (err) {
        console.error('Database error during resend code check:', err);
        return res.status(500).json({ error: 'Database error.' });
      }

      if (results.length === 0) {
        return res.status(404).json({ error: 'Customer not found with this email.' });
      }

      const user = results[0];

      if (user.is_verified) {
        return res.status(400).json({ error: 'Email is already verified. Please sign in.' });
      }

      const newVerificationCode = generateVerificationCode();

      db.query(
        'UPDATE users SET verification_code = ? WHERE email = ? AND user_type = "customer"',
        [newVerificationCode, email],
        async (updateErr) => {
          if (updateErr) {
            console.error('Database error updating verification code:', updateErr);
            return res.status(500).json({ error: 'Failed to generate new verification code.' });
          }

          try {
            await emailService.sendVerificationEmail(email, newVerificationCode);
            res.status(200).json({ message: 'New verification code sent successfully. Please check your email.' });
          } catch (emailError) {
            console.error('Error sending new verification email:', emailError);
            res.status(500).json({ error: 'Failed to send new verification email. Please try again.' });
          }
        }
      );
    });
  } catch (error) {
    console.error('Server error during resend verification code:', error);
    res.status(500).json({ error: 'Server error.' });
  }
});

module.exports = router;
