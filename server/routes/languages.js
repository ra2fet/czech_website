// routes/languages.js
const express = require('express');
const db = require('../config/db');
const i18n = require('../utils/i18n');

const router = express.Router();

// Get all supported languages
router.get('/', (req, res) => {
  try {
    db.query('SELECT * FROM languages WHERE is_active = 1 ORDER BY is_default DESC, name ASC', (err, results) => {
      if (err) {
        console.error('Error fetching languages:', err);
        // Fallback to hardcoded languages if database query fails
        const fallbackLanguages = i18n.getSupportedLanguages().map(code => ({
          code,
          name: code === 'en' ? 'English' : 'Nederlands',
          native_name: code === 'en' ? 'English' : 'Nederlands',
          is_default: code === 'en',
          is_active: true
        }));
        return res.json(fallbackLanguages);
      }
      res.json(results);
    });
  } catch (error) {
    console.error('Error in languages route:', error);
    res.status(500).json({ 
      error: req.t('errors.general.internal_error')
    });
  }
});

// Get current language info
router.get('/current', (req, res) => {
  try {
    const currentLanguage = req.language;
    
    db.query('SELECT * FROM languages WHERE code = ? AND is_active = 1', [currentLanguage], (err, results) => {
      if (err) {
        console.error('Error fetching current language:', err);
        // Fallback
        return res.json({
          code: currentLanguage,
          name: currentLanguage === 'en' ? 'English' : 'Nederlands',
          native_name: currentLanguage === 'en' ? 'English' : 'Nederlands',
          is_default: currentLanguage === 'en',
          is_active: true
        });
      }
      
      if (results.length === 0) {
        return res.status(404).json({ 
          error: req.t('errors.resources.not_found', { resource: 'Language' })
        });
      }
      
      res.json(results[0]);
    });
  } catch (error) {
    console.error('Error getting current language:', error);
    res.status(500).json({ 
      error: req.t('errors.general.internal_error')
    });
  }
});

// Get supported language codes (simple array)
router.get('/codes', (req, res) => {
  try {
    const supportedCodes = i18n.getSupportedLanguages();
    res.json(supportedCodes);
  } catch (error) {
    console.error('Error getting language codes:', error);
    res.status(500).json({ 
      error: req.t('errors.general.internal_error')
    });
  }
});

module.exports = router;