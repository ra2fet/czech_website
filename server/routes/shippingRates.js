const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth'); // Correct import

// Get all shipping rates
router.get('/', (req, res) => {
  db.query('SELECT * FROM shipping_rates ORDER BY min_price ASC', (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send(`Server Error:  ${err.message}`);
    }
    res.json(rows);
  });
});

// Get active shipping rates
router.get('/active', (req, res) => {
  db.query('SELECT * FROM shipping_rates WHERE is_active = TRUE ORDER BY min_price ASC', (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send(`Server Error: ${err.message}`);
    }
    res.json(rows);
  });
});

// Add a new shipping rate (Admin only)
router.post('/', authenticateToken, adminProtect, (req, res) => {
  const { min_price, max_price, percentage_rate, is_active } = req.body;
  db.query(
    'INSERT INTO shipping_rates (min_price, max_price, percentage_rate, is_active) VALUES (?, ?, ?, ?)',
    [min_price, max_price, percentage_rate, is_active],
    (err, result) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send(`Server Error:  ${err.message}`);
      }
      res.json({ id: result.insertId, min_price, max_price, percentage_rate, is_active });
    }
  );
});

// Update a shipping rate (Admin only)
router.put('/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;
  const { min_price, max_price, percentage_rate, is_active } = req.body;
  db.query(
    'UPDATE shipping_rates SET min_price = ?, max_price = ?, percentage_rate = ?, is_active = ? WHERE id = ?',
    [min_price, max_price, percentage_rate, is_active, id],
    (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send(`Server Error:  ${err.message}`);
      }
      res.json({ msg: 'Shipping rate updated' });
    }
  );
});

// Delete a shipping rate (Admin only)
router.delete('/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM shipping_rates WHERE id = ?', [id], (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send(`Server Error:  ${err.message}`);
    }
    res.json({ msg: 'Shipping rate deleted' });
  });
});

module.exports = router;
