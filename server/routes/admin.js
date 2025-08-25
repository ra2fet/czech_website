const express = require('express');
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth'); // Assuming you have an auth middleware

const router = express.Router();

// Middleware to ensure only admins can access these routes
router.use(authenticateToken, adminProtect); // Apply authentication and admin protection middleware

// Get all company users (pending and active)
router.get('/companies', (req, res) => {
  const query = `
    SELECT u.id, u.full_name, u.email, u.phone_number, u.user_type, u.is_active, c.company_name, c.license_number
    FROM users u
    JOIN companies c ON u.id = c.user_id
    WHERE u.user_type = 'company'
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching company users:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Approve a company account
router.put('/companies/:id/approve', (req, res) => {
  const userId = req.params.id;
  db.query('UPDATE users SET is_active = TRUE WHERE id = ? AND user_type = "company"', [userId], (err, result) => {
    if (err) {
      console.error('Error approving company:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company user not found or already active.' });
    }
    res.json({ message: 'Company account approved.' });
  });
});

// Decline/Deactivate a company account
router.put('/companies/:id/decline', (req, res) => {
  const userId = req.params.id;
  db.query('UPDATE users SET is_active = FALSE WHERE id = ? AND user_type = "company"', [userId], (err, result) => {
    if (err) {
      console.error('Error declining company:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company user not found.' });
    }
    res.json({ message: 'Company account deactivated.' });
  });
});

module.exports = router;
