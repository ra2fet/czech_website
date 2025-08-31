const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth'); // Correct import

// Get all coupon codes
router.get('/', (req, res) => {
  db.query('SELECT * FROM coupon_codes', (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: req.t('errors.database.connection_error') });
    }
    res.json(rows);
  });
});

// Get active coupon codes
router.get('/active', (req, res) => {
  db.query('SELECT * FROM coupon_codes WHERE is_active = TRUE AND (expiry_date IS NULL OR expiry_date >= CURDATE()) AND (max_uses IS NULL OR uses_count < max_uses)', (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: req.t('errors.database.connection_error') });
    }
    res.json(rows);
  });
});

// Get a single coupon code by code (for applying)
router.get('/:code', (req, res) => {
  const { code } = req.params;
  db.query(
    'SELECT * FROM coupon_codes WHERE code = ? AND is_active = TRUE AND (expiry_date IS NULL OR expiry_date >= CURDATE()) AND (max_uses IS NULL OR uses_count < max_uses)',
    [code],
    (err, rows) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: req.t('errors.database.connection_error') });
      }
      if (rows.length === 0) {
        return res.status(404).json({ error: req.t('errors.resources.not_found', { resource: req.getResource('coupon') }) });
      }
      res.json(rows[0]);
    }
  );
});

// Add a new coupon code (Admin only)
router.post('/', authenticateToken, adminProtect, (req, res) => {
  const { code, discount_type, discount_value, min_cart_value, max_uses, expiry_date, is_active } = req.body;
  db.query(
    'INSERT INTO coupon_codes (code, discount_type, discount_value, min_cart_value, max_uses, expiry_date, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [code, discount_type, discount_value, min_cart_value, max_uses, expiry_date, is_active],
    (err, result) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: req.t('errors.resources.creation_failed', { resource: req.getResource('coupon') }) });
      }
      res.json({ 
        id: result.insertId, 
        code, 
        discount_type, 
        discount_value, 
        min_cart_value, 
        max_uses, 
        expiry_date, 
        is_active,
        message: req.t('success.resources.created', { resource: req.getResource('coupon') })
      });
    }
  );
});

// Update a coupon code (Admin only)
router.put('/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;
  const { code, discount_type, discount_value, min_cart_value, max_uses, expiry_date, is_active } = req.body;
  db.query(
    'UPDATE coupon_codes SET code = ?, discount_type = ?, discount_value = ?, min_cart_value = ?, max_uses = ?, expiry_date = ?, is_active = ? WHERE id = ?',
    [code, discount_type, discount_value, min_cart_value, max_uses, expiry_date, is_active, id],
    (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: req.t('errors.resources.update_failed', { resource: req.getResource('coupon') }) });
      }
      res.json({ message: req.t('success.resources.updated', { resource: req.getResource('coupon') }) });
    }
  );
});

// Increment uses_count for a coupon code
router.put('/use/:id', (req, res) => {
  const { id } = req.params;
  db.query('UPDATE coupon_codes SET uses_count = uses_count + 1 WHERE id = ?', [id], (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: req.t('errors.database.connection_error') });
    }
    res.json({ message: req.t('success.general.operation_completed') });
  });
});

// Delete a coupon code (Admin only)
router.delete('/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM coupon_codes WHERE id = ?', [id], (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: req.t('errors.resources.deletion_failed', { resource: req.getResource('coupon') }) });
    }
    res.json({ message: req.t('success.resources.deleted', { resource: req.getResource('coupon') }) });
  });
});

module.exports = router;
