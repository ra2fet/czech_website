const express = require('express');
const db = require('../config/db'); // Assuming db connection is available

const router = express.Router();

router.post('/subscribe', (req, res) => {
  const { email } = req.body;

  // Validation with localized messages
  const validationErrors = [];
  if (!email) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('email') }));
  } else if (!email.includes('@')) {
    validationErrors.push(req.t('errors.validation.invalid_email'));
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  // Check if email is already subscribed
  const checkQuery = 'SELECT * FROM newsletter_subscriptions WHERE email = ?';
  db.query(checkQuery, [email], (err, results) => {
    if (err) {
      console.error('Database error checking subscription:', err);
      return res.status(500).json({ error: req.t('errors.database.connection_error') });
    }

    if (results.length > 0) {
      return res.status(409).json({ error: req.t('errors.resources.already_exists', { resource: 'Email subscription' }) });
    }

    // Insert new subscription
    const insertQuery = 'INSERT INTO newsletter_subscriptions (email) VALUES (?)';
    db.query(insertQuery, [email], (err, result) => {
      if (err) {
        console.error('Database error inserting subscription:', err);
        return res.status(500).json({ error: req.t('errors.database.connection_error') });
      }
      res.status(200).json({ message: req.t('success.email.newsletter_subscribed') });
    });
  });
});

module.exports = router;
