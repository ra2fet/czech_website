const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth');

// Get all FAQs with translations for the current language
router.get('/', (req, res) => {
  const languageCode = req.language;
  db.query(
    `SELECT f.id, ft.question, ft.answer, f.created_at, f.updated_at
     FROM faqs f
     JOIN faqs_translations ft ON f.id = ft.faq_id
     WHERE ft.language_code = ?
     ORDER BY f.created_at DESC`,
    [languageCode],
    (err, results) => {
      if (err) {
        console.error('Error fetching FAQs:', err);
        return res.status(500).json({ 
          error: req.t('errors.resources.fetch_failed', { resource: req.getResource('faq', true) })
        });
      }
      res.json(results);
    }
  );
});

// Admin: Get all FAQs with all translations
router.get('/admin', authenticateToken, adminProtect, async (req, res) => {
  try {
    const [faqs] = await db.promise().query('SELECT * FROM faqs ORDER BY created_at DESC');
    const [translations] = await db.promise().query('SELECT * FROM faqs_translations');

    const faqsWithTranslations = faqs.map((faq) => {
      const faqTranslations = {};
      translations.forEach((t) => {
        if (t.faq_id === faq.id) {
          faqTranslations[t.language_code] = { question: t.question, answer: t.answer };
        }
      });
      return {
        ...faq,
        question: faqTranslations[req.language]?.question || faqTranslations['en']?.question || '',
        answer: faqTranslations[req.language]?.answer || faqTranslations['en']?.answer || '',
        translations: faqTranslations,
      };
    });
    res.json(faqsWithTranslations);
  } catch (error) {
    console.error('Error fetching all FAQs with translations:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.fetch_failed', { resource: req.getResource('faq', true) })
    });
  }
});

// Get a single FAQ by ID with translations
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const languageCode = req.language;
  
  db.query(
    `SELECT f.id, ft.question, ft.answer, f.created_at, f.updated_at
     FROM faqs f
     JOIN faqs_translations ft ON f.id = ft.faq_id
     WHERE f.id = ? AND ft.language_code = ?`,
    [id, languageCode],
    (err, results) => {
      if (err) {
        console.error('Error fetching FAQ:', err);
        return res.status(500).json({ 
          error: req.t('errors.resources.fetch_failed', { resource: req.getResource('faq') })
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ 
          error: req.t('errors.resources.not_found', { resource: req.getResource('faq') })
        });
      }

      res.json(results[0]);
    }
  );
});

// Create a new FAQ (Admin only)
router.post('/', authenticateToken, adminProtect, async (req, res) => {
  const { translations } = req.body;
  const defaultLanguageCode = req.language;

  // Validation with localized messages
  const validationErrors = [];
  if (!translations || !translations[defaultLanguageCode]?.question) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('question') }));
  }
  if (!translations || !translations[defaultLanguageCode]?.answer) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('answer') }));
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    const [faqResult] = await db.promise().query(
      'INSERT INTO faqs () VALUES ()'
    );
    const faqId = faqResult.insertId;

    // Insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.question && translations[langCode]?.answer) {
        await db.promise().query(
          'INSERT INTO faqs_translations (faq_id, language_code, question, answer) VALUES (?, ?, ?, ?)',
          [faqId, langCode, translations[langCode].question, translations[langCode].answer]
        );
      }
    }

    res.status(201).json({ 
      message: req.t('success.resources.created', { resource: req.getResource('faq') }),
      id: faqId
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.creation_failed', { resource: req.getResource('faq') })
    });
  }
});

// Update an FAQ (Admin only)
router.put('/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;
  const { translations } = req.body;
  const defaultLanguageCode = req.language;

  // Validation with localized messages
  const validationErrors = [];
  if (!translations || !translations[defaultLanguageCode]?.question) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('question') }));
  }
  if (!translations || !translations[defaultLanguageCode]?.answer) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('answer') }));
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    // Check if FAQ exists
    const [faqExists] = await db.promise().query('SELECT id FROM faqs WHERE id = ?', [id]);

    if (faqExists.length === 0) {
      return res.status(404).json({ 
        error: req.t('errors.resources.not_found', { resource: req.getResource('faq') })
      });
    }

    // Update or insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.question && translations[langCode]?.answer) {
        const [translationExists] = await db.promise().query(
          'SELECT id FROM faqs_translations WHERE faq_id = ? AND language_code = ?',
          [id, langCode]
        );

        if (translationExists.length > 0) {
          // Update existing translation
          await db.promise().query(
            'UPDATE faqs_translations SET question = ?, answer = ?, updated_at = CURRENT_TIMESTAMP WHERE faq_id = ? AND language_code = ?',
            [translations[langCode].question, translations[langCode].answer, id, langCode]
          );
        } else {
          // Insert new translation
          await db.promise().query(
            'INSERT INTO faqs_translations (faq_id, language_code, question, answer) VALUES (?, ?, ?, ?)',
            [id, langCode, translations[langCode].question, translations[langCode].answer]
          );
        }
      }
    }

    res.json({ 
      message: req.t('success.resources.updated', { resource: req.getResource('faq') })
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.update_failed', { resource: req.getResource('faq') })
    });
  }
});

// Delete an FAQ (Admin only)
router.delete('/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Deleting from the main faqs table will cascade delete from faqs_translations
    const [result] = await db.promise().query('DELETE FROM faqs WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: req.t('errors.resources.not_found', { resource: req.getResource('faq') })
      });
    }

    res.json({ 
      message: req.t('success.resources.deleted', { resource: req.getResource('faq') })
    });
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.deletion_failed', { resource: req.getResource('faq') })
    });
  }
});

module.exports = router;
