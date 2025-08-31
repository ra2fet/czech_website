const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth'); // Correct import

// Get all tax fees
router.get('/', (req, res) => {
  db.query('SELECT * FROM tax_fees', (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: req.t('errors.database.connection_error') });
    }
    res.json(rows);
  });
});

// Get active tax fees
router.get('/active', (req, res) => {
  db.query('SELECT * FROM tax_fees WHERE is_active = TRUE', (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: req.t('errors.database.connection_error') });
    }
    res.json(rows);
  });
});

// Add a new tax fee (Admin only)
router.post('/', authenticateToken, adminProtect, (req, res) => {
  const { name, rate, is_active } = req.body;
  db.query(
    'INSERT INTO tax_fees (name, rate, is_active) VALUES (?, ?, ?)',
    [name, rate, is_active],
    (err, result) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: req.t('errors.resources.creation_failed', { resource: 'Tax Fee' }) });
      }
      res.json({ 
        id: result.insertId, 
        name, 
        rate, 
        is_active,
        message: req.t('success.resources.created', { resource: 'Tax Fee' })
      });
    }
  );
});

// Update a tax fee (Admin only)
router.put('/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;
  const { name, rate, is_active } = req.body;
  db.query(
    'UPDATE tax_fees SET name = ?, rate = ?, is_active = ? WHERE id = ?',
    [name, rate, is_active, id],
    (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).json({ error: req.t('errors.resources.update_failed', { resource: 'Tax Fee' }) });
      }
      res.json({ message: req.t('success.resources.updated', { resource: 'Tax Fee' }) });
    }
  );
});

// Delete a tax fee (Admin only)
router.delete('/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;
  db.query('DELETE FROM tax_fees WHERE id = ?', [id], (err) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: req.t('errors.resources.deletion_failed', { resource: 'Tax Fee' }) });
    }
    res.json({ message: req.t('success.resources.deleted', { resource: 'Tax Fee' }) });
  });
});

module.exports = router;
