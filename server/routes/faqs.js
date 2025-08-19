const express = require('express');
const router = express.Router();
const db = require('../config/db');
const auth = require('../middleware/auth'); // Assuming you have an auth middleware

// Get all FAQs
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT * FROM faqs ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching FAQs:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get a single FAQ by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.promise().query('SELECT * FROM faqs WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Error fetching FAQ by ID:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create a new FAQ (Admin only)
router.post('/', auth, async (req, res) => {
  const { question, answer } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ message: 'Question and answer are required' });
  }
  try {
    const [result] = await db.promise().query('INSERT INTO faqs (question, answer) VALUES (?, ?)', [question, answer]);
    res.status(201).json({ message: 'FAQ created successfully', faqId: result.insertId });
  } catch (err) {
    console.error('Error creating FAQ:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Update an FAQ (Admin only)
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params;
  const { question, answer } = req.body;
  if (!question || !answer) {
    return res.status(400).json({ message: 'Question and answer are required' });
  }
  try {
    const [result] = await db.promise().query('UPDATE faqs SET question = ?, answer = ? WHERE id = ?', [question, answer, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    res.json({ message: 'FAQ updated successfully' });
  } catch (err) {
    console.error('Error updating FAQ:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Delete an FAQ (Admin only)
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await db.promise().query('DELETE FROM faqs WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'FAQ not found' });
    }
    res.json({ message: 'FAQ deleted successfully' });
  } catch (err) {
    console.error('Error deleting FAQ:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
