// routes/blogs.js
const express = require('express');
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  db.query('SELECT * FROM blogs ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('Error fetching blogs:', err);
      return res.status(500).json({ error: 'Failed to fetch blogs' });
    }
    res.json(results);
  });
});

// GET a single blog post by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM blogs WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error fetching blog post:', err);
      return res.status(500).json({ error: 'Failed to fetch blog post' });
    }
    if (results.length === 0) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    res.json(results[0]);
  });
});

router.post('/', authenticateToken, adminProtect, (req, res) => {
  const { title, content, excerpt, image_url } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  db.query(
    'INSERT INTO blogs (title, content, excerpt, image_url) VALUES (?, ?, ?, ?)',
    [title, content, excerpt || null, image_url || null],
    (err, result) => {
      if (err) {
        console.error('Error creating blog:', err);
        return res.status(500).json({ error: 'Failed to create blog' });
      }
      res.status(201).json({ message: 'Blog created successfully', id: result.insertId });
    }
  );
});

router.put('/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;
  const { title, content, excerpt, image_url } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  db.query(
    'UPDATE blogs SET title = ?, content = ?, excerpt = ?, image_url = ? WHERE id = ?',
    [title, content, excerpt || null, image_url || null, id],
    (err, result) => {
      if (err) {
        console.error('Error updating blog:', err);
        return res.status(500).json({ error: 'Failed to update blog' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Blog not found' });
      }
      res.json({ message: 'Blog updated successfully' });
    }
  );
});

router.delete('/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM blogs WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting blog:', err);
      return res.status(500).json({ error: 'Failed to delete blog' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    res.json({ message: 'Blog deleted successfully' });
  });
});

module.exports = router;
