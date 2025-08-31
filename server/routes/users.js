const express = require('express');
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth'); // Import auth middleware

const router = express.Router();

// Get all users (Admin only)
router.get('/',  authenticateToken, adminProtect, (req, res) => {
  const query = "SELECT id, full_name, phone_number, email, user_type, is_active, is_verified, created_at FROM users WHERE user_type = 'customer'";
  db.query(query, (err, results) => {
    if (err) {
      console.error('Database error fetching users:', err);
      return res.status(500).json({ error: req.t('errors.database.connection_error') });
    }
    res.json(results);
  });
});

// Get a single user by ID (Admin only)
router.get('/:id',  authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;
  const query = 'SELECT id, full_name, phone_number, email, user_type, is_active, is_verified, created_at FROM users WHERE id = ?';
  db.query(query, [id], (err, results) => {
    if (err) {
      console.error('Database error fetching user:', err);
      return res.status(500).json({ error: req.t('errors.database.connection_error') });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: req.t('errors.resources.not_found', { resource: req.getResource('user') }) });
    }
    res.json(results[0]);
  });
});

// Update a user (Admin only)
router.put('/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;
  const { full_name, phone_number, email, user_type, is_active, is_verified } = req.body;

  const query = 'UPDATE users SET full_name = ?, phone_number = ?, email = ?, user_type = ?, is_active = ?, is_verified = ? WHERE id = ?';
  db.query(query, [full_name, phone_number, email, user_type, is_active, is_verified, id], (err, result) => {
    if (err) {
      console.error('Database error updating user:', err);
      return res.status(500).json({ error: req.t('errors.database.connection_error') });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: req.t('errors.resources.not_found', { resource: req.getResource('user') }) });
    }
    res.json({ message: req.t('success.resources.updated', { resource: req.getResource('user') }) });
  });
});

// Delete a user (Admin only)
router.delete('/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM users WHERE id = ?';
  db.query(query, [id], (err, result) => {
    if (err) {
      console.error('Database error deleting user:', err);
      return res.status(500).json({ error: req.t('errors.database.connection_error') });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: req.t('errors.resources.not_found', { resource: req.getResource('user') }) });
    }
    res.json({ message: req.t('success.resources.deleted', { resource: req.getResource('user') }) });
  });
});

module.exports = router;
