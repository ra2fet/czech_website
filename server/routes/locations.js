// routes/locations.js
const express = require('express');
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  db.query('SELECT id, name, address, phone, email, image_url, ST_X(position) AS longitude, ST_Y(position) AS latitude, created_at, updated_at FROM locations ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('Error fetching locations:', err);
      return res.status(500).json({ error: 'Failed to fetch locations' });
    }
    res.json(results);
  });
});

router.post('/', authenticateToken, (req, res) => {
  const { name, address, phone, email, image_url, position } = req.body;

  if (!name || !address) {
    return res.status(400).json({ error: 'Name and address are required' });
  }

  let positionValue = null;
  if (position && position.match(/^\s*\(\s*-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\s*\)\s*$/)) {
    const [lat, lon] = position.replace(/[()]/g, '').split(',').map(coord => parseFloat(coord.trim()));
    positionValue = `POINT(${lon}, ${lat})`;
  }

  db.query(
    'INSERT INTO locations (name, address, phone, email, image_url, position) VALUES (?, ?, ?, ?, ?, ?)',
    [name, address, phone || null, email || null, image_url || null, positionValue],
    (err, result) => {
      if (err) {
        console.error('Error creating location:', err);
        return res.status(500).json({ error: 'Failed to create location' });
      }
      res.status(201).json({ message: 'Location created successfully', id: result.insertId });
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, address, phone, email, image_url, position } = req.body;

  if (!name || !address) {
    return res.status(400).json({ error: 'Name and address are required' });
  }

  let positionValue = null;
  if (position && position.match(/^\s*\(\s*-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\s*\)\s*$/)) {
    const [lat, lon] = position.replace(/[()]/g, '').split(',').map(coord => parseFloat(coord.trim()));
    positionValue = `POINT(${lon}, ${lat})`;
  }

  db.query(
    'UPDATE locations SET name = ?, address = ?, phone = ?, email = ?, image_url = ?, position = ? WHERE id = ?',
    [name, address, phone || null, email || null, image_url || null, positionValue, id],
    (err, result) => {
      if (err) {
        console.error('Error updating location:', err);
        return res.status(500).json({ error: 'Failed to update location' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Location not found' });
      }
      res.json({ message: 'Location updated successfully' });
    }
  );
});

router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM locations WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting location:', err);
      return res.status(500).json({ error: 'Failed to delete location' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Location not found' });
    }
    res.json({ message: 'Location deleted successfully' });
  });
});

module.exports = router;