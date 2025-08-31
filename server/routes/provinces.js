const express = require('express');
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth');

const router = express.Router();

// GET all provinces with translations
router.get('/', (req, res) => {
  const languageCode = req.language;
  db.query(
    `SELECT p.id, pt.name, p.created_at, p.updated_at
     FROM provinces p
     JOIN provinces_translations pt ON p.id = pt.province_id
     WHERE pt.language_code = ?
     ORDER BY pt.name ASC`,
    [languageCode],
    (err, results) => {
      if (err) {
        console.error('Error fetching provinces:', err);
        return res.status(500).json({ 
          error: req.t('errors.resources.fetch_failed', { resource: req.getResource('province', true) })
        });
      }
      res.json(results);
    }
  );
});

// Admin: Get all provinces with all translations
router.get('/admin', authenticateToken, adminProtect, async (req, res) => {
  try {
    const [provinces] = await db.promise().query('SELECT * FROM provinces ORDER BY created_at DESC');
    const [translations] = await db.promise().query('SELECT * FROM provinces_translations');

    const provincesWithTranslations = provinces.map((province) => {
      const provinceTranslations = {};
      translations.forEach((t) => {
        if (t.province_id === province.id) {
          provinceTranslations[t.language_code] = { name: t.name };
        }
      });
      return {
        ...province,
        name: provinceTranslations[req.language]?.name || provinceTranslations['en']?.name || '',
        translations: provinceTranslations,
      };
    });
    res.json(provincesWithTranslations);
  } catch (error) {
    console.error('Error fetching all provinces with translations:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.fetch_failed', { resource: req.getResource('province', true) })
    });
  }
});

// Admin: Create a new province
router.post('/', authenticateToken, adminProtect, async (req, res) => {
  const { translations } = req.body;
  const defaultLanguageCode = req.language;

  // Validation with localized messages
  if (!translations || !translations[defaultLanguageCode]?.name) {
    return res.status(400).json({ 
      error: req.t('errors.validation.required', { field: req.getFieldName('name') })
    });
  }

  try {
    const [provinceResult] = await db.promise().query(
      'INSERT INTO provinces () VALUES ()'
    );
    const provinceId = provinceResult.insertId;

    // Insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.name) {
        await db.promise().query(
          'INSERT INTO provinces_translations (province_id, language_code, name) VALUES (?, ?, ?)',
          [provinceId, langCode, translations[langCode].name]
        );
      }
    }

    res.status(201).json({ 
      message: req.t('success.resources.created', { resource: req.getResource('province') }),
      id: provinceId
    });
  } catch (error) {
    console.error('Error creating province:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.creation_failed', { resource: req.getResource('province') })
    });
  }
});

// Admin: Update an existing province
router.put('/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;
  const { translations } = req.body;
  const defaultLanguageCode = req.language;

  // Validation with localized messages
  if (!translations || !translations[defaultLanguageCode]?.name) {
    return res.status(400).json({ 
      error: req.t('errors.validation.required', { field: req.getFieldName('name') })
    });
  }

  try {
    // Check if province exists
    const [provinceExists] = await db.promise().query('SELECT id FROM provinces WHERE id = ?', [id]);

    if (provinceExists.length === 0) {
      return res.status(404).json({ 
        error: req.t('errors.resources.not_found', { resource: req.getResource('province') })
      });
    }

    // Update or insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.name) {
        const [translationExists] = await db.promise().query(
          'SELECT id FROM provinces_translations WHERE province_id = ? AND language_code = ?',
          [id, langCode]
        );

        if (translationExists.length > 0) {
          // Update existing translation
          await db.promise().query(
            'UPDATE provinces_translations SET name = ?, updated_at = CURRENT_TIMESTAMP WHERE province_id = ? AND language_code = ?',
            [translations[langCode].name, id, langCode]
          );
        } else {
          // Insert new translation
          await db.promise().query(
            'INSERT INTO provinces_translations (province_id, language_code, name) VALUES (?, ?, ?)',
            [id, langCode, translations[langCode].name]
          );
        }
      }
    }

    res.json({ 
      message: req.t('success.resources.updated', { resource: req.getResource('province') })
    });
  } catch (error) {
    console.error('Error updating province:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.update_failed', { resource: req.getResource('province') })
    });
  }
});

// Admin: Delete a province
router.delete('/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;

  try {
    // Deleting from the main provinces table will cascade delete from provinces_translations
    const [result] = await db.promise().query('DELETE FROM provinces WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: req.t('errors.resources.not_found', { resource: req.getResource('province') })
      });
    }

    res.json({ 
      message: req.t('success.resources.deleted', { resource: req.getResource('province') })
    });
  } catch (error) {
    console.error('Error deleting province:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.deletion_failed', { resource: req.getResource('province') })
    });
  }
});

module.exports = router;
