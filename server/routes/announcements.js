const express = require('express');
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth');

const router = express.Router();

// Get all active announcements for the frontend marquee
router.get('/', (req, res) => {
  const languageCode = req.language;
  db.query(
    `SELECT a.id, at.message, a.is_active, a.created_at, a.updated_at
     FROM announcements a
     JOIN announcements_translations at ON a.id = at.announcement_id
     WHERE a.is_active = TRUE AND at.language_code = ?
     ORDER BY a.created_at DESC`,
    [languageCode],
    (err, results) => {
      if (err) {
        console.error('Error fetching active announcements:', err);
        return res.status(500).json({ error: 'Failed to fetch active announcements' });
      }
      res.json(results);
    }
  );
});

// Admin: Get all announcements (active and inactive) with all translations
router.get('/admin', authenticateToken, adminProtect, async (req, res) => {
  try {
    const [announcements] = await db.promise().query('SELECT * FROM announcements ORDER BY created_at DESC');
    const [translations] = await db.promise().query('SELECT * FROM announcements_translations');

    const announcementsWithTranslations = announcements.map((announcement) => {
      const announcementTranslations = {};
      translations.forEach((t) => {
        if (t.announcement_id === announcement.id) {
          announcementTranslations[t.language_code] = { message: t.message };
        }
      });
      return {
        ...announcement,
        message: announcementTranslations[req.language]?.message || announcementTranslations['en']?.message || '', // Default to current language, then English
        translations: announcementTranslations,
      };
    });
    res.json(announcementsWithTranslations);
  } catch (err) {
    console.error('Error fetching all announcements with translations:', err);
    res.status(500).json({ error: 'Failed to fetch all announcements' });
  }
});

// Admin: Add a new announcement
router.post('/', authenticateToken, adminProtect, async (req, res) => {
  const { is_active, translations } = req.body; // Expect translations object
  const defaultLanguageCode = req.language; // Use the request language as default for initial message

  if (!translations || !translations[defaultLanguageCode]?.message) {
    return res.status(400).json({ error: `Announcement message for default language (${defaultLanguageCode}) is required` });
  }

  try {
    const [announcementResult] = await db.promise().query(
      'INSERT INTO announcements (is_active) VALUES (?)',
      [is_active === true]
    );
    const announcementId = announcementResult.insertId;

    // Insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.message) {
        await db.promise().query(
          'INSERT INTO announcements_translations (announcement_id, language_code, message) VALUES (?, ?, ?)',
          [announcementId, langCode, translations[langCode].message]
        );
      }
    }

    res.status(201).json({ message: 'Announcement created successfully', id: announcementId });
  } catch (err) {
    console.error('Error creating announcement:', err);
    res.status(500).json({ error: 'Failed to create announcement' });
  }
});

// Admin: Update an existing announcement
router.put('/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;
  const { is_active, translations } = req.body; // Expect translations object
  const defaultLanguageCode = req.language;

  if (!translations || !translations[defaultLanguageCode]?.message) {
    return res.status(400).json({ error: `Announcement message for default language (${defaultLanguageCode}) is required` });
  }

  try {
    // Update the main announcement table
    const [updateAnnouncementResult] = await db.promise().query(
      'UPDATE announcements SET is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [is_active === true, id]
    );

    if (updateAnnouncementResult.affectedRows === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }

    // Update or insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.message) {
        const [translationExists] = await db.promise().query(
          'SELECT id FROM announcements_translations WHERE announcement_id = ? AND language_code = ?',
          [id, langCode]
        );

        if (translationExists.length > 0) {
          // Update existing translation
          await db.promise().query(
            'UPDATE announcements_translations SET message = ?, updated_at = CURRENT_TIMESTAMP WHERE announcement_id = ? AND language_code = ?',
            [translations[langCode].message, id, langCode]
          );
        } else {
          // Insert new translation
          await db.promise().query(
            'INSERT INTO announcements_translations (announcement_id, language_code, message) VALUES (?, ?, ?)',
            [id, langCode, translations[langCode].message]
          );
        }
      }
    }

    res.json({ message: 'Announcement updated successfully' });
  } catch (err) {
    console.error('Error updating announcement:', err);
    res.status(500).json({ error: 'Failed to update announcement' });
  }
});

// Admin: Delete an announcement
router.delete('/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;

  try {
    // Deleting from the main announcements table will cascade delete from announcements_translations
    const [result] = await db.promise().query('DELETE FROM announcements WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Announcement not found' });
    }
    res.json({ message: 'Announcement deleted successfully' });
  } catch (err) {
    console.error('Error deleting announcement:', err);
    res.status(500).json({ error: 'Failed to delete announcement' });
  }
});

module.exports = router;
