const express = require('express');
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth');

const router = express.Router();

// Get all active announcements for the frontend marquee
router.get('/', (req, res) => {
  db.query('SELECT *  FROM announcements WHERE is_active = TRUE ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('Error fetching active announcements:', err);
      return res.status(500).json({ error: 'Failed to fetch active announcements' });
    }
    res.json(results);
  });
});

// Admin: Get all announcements (active and inactive)
router.get('/', authenticateToken, adminProtect, (req, res) => {
  db.query('SELECT * FROM announcements ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('Error fetching all announcements:', err);
      return res.status(500).json({ error: 'Failed to fetch all announcements' });
    }
    res.json(results);
  });
});

// Admin: Add a new announcement
router.post('/', authenticateToken, adminProtect, (req, res) => {
  const { message, is_active } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Announcement message is required' });
  }

  db.query(
    'INSERT INTO announcements (message, is_active) VALUES (?, ?)',
    [message, is_active === true],
    (err, result) => {
      if (err) {
        console.error('Error creating announcement:', err);
        return res.status(500).json({ error: 'Failed to create announcement' });
      }
      res.status(201).json({ message: 'Announcement created successfully', id: result.insertId });
    }
  );
});

// Admin: Update an existing announcement
router.put('/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;
  const { message, is_active } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Announcement message is required' });
  }

  db.query(
    'UPDATE announcements SET message = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
    [message, is_active === true, id],
    (err, result) => {
      if (err) {
        console.error('Error updating announcement:', err);
        return res.status(500).json({ error: 'Failed to update announcement' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      res.json({ message: 'Announcement updated successfully' });
    }
  );
});

// Admin: Delete an announcement
router.delete('/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM announcements WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting announcement:', err);
      return res.status(500).json({ error: 'Failed to delete announcement' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted successfully' });
  });
});

module.exports = router;
