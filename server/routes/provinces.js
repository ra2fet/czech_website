const express = require('express');
const db = require('../config/db');

const router = express.Router();

// GET all provinces
router.get('/', (req, res) => {
  const query = 'SELECT id, name FROM provinces ORDER BY name ASC';
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching provinces:', err);
      return res.status(500).json({ error: 'Failed to fetch provinces' });
    }
    res.json(results);
  });
});

module.exports = router;
