const express = require('express');
const db = require('../config/db'); // Assuming db connection is available

const router = express.Router();

router.post('/subscribe', (req, res) => {
  const { email } = req.body;

  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  // Check if email is already subscribed
  const checkQuery = 'SELECT * FROM newsletter_subscriptions WHERE email = ?';
  db.query(checkQuery, [email], (err, results) => {
    if (err) {
      console.error('Database error checking subscription:', err);
      return res.status(500).json({ message: 'Server error during subscription check.' });
    }

    if (results.length > 0) {
      return res.status(409).json({ message: 'Email already subscribed.' });
    }

    // Insert new subscription
    const insertQuery = 'INSERT INTO newsletter_subscriptions (email) VALUES (?)';
    db.query(insertQuery, [email], (err, result) => {
      if (err) {
        console.error('Database error inserting subscription:', err);
        return res.status(500).json({ message: 'Server error during subscription.' });
      }
      res.status(200).json({ message: 'Subscription successful!' });
    });
  });
});

module.exports = router;
