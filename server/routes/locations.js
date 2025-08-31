// routes/locations.js
const express = require('express');
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth');

const router = express.Router();

// Get all locations with translations for the current language
router.get('/', async (req, res) => {
  try {
    // Note: Locations have special handling for POINT data that needs custom query
    const query = `
      SELECT 
        l.*,
        COALESCE(lt1.name, lt2.name) as name,
        COALESCE(lt1.address, lt2.address) as address,
        ST_X(l.position) AS longitude, 
        ST_Y(l.position) AS latitude
      FROM locations l
      LEFT JOIN locations_translations lt1 ON l.id = lt1.location_id AND lt1.language_code = ?
      LEFT JOIN locations_translations lt2 ON l.id = lt2.location_id AND lt2.language_code = 'en'
      ORDER BY l.created_at DESC
    `;
    
    const results = await new Promise((resolve, reject) => {
      db.query(query, [req.language], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    res.json(results);
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.fetch_failed', { resource: req.getResource('location', true) })
    });
  }
});

// Admin: Get all locations with all translations
router.get('/admin', authenticateToken, adminProtect, async (req, res) => {
  try {
    const [locations] = await db.promise().query(
      `SELECT l.*, ST_X(l.position) AS longitude, ST_Y(l.position) AS latitude 
       FROM locations l 
       ORDER BY l.created_at DESC`
    );
    const [translations] = await db.promise().query('SELECT * FROM locations_translations');

    const locationsWithTranslations = locations.map((location) => {
      const locationTranslations = {};
      translations.forEach((t) => {
        if (t.location_id === location.id) {
          locationTranslations[t.language_code] = { name: t.name, address: t.address };
        }
      });
      return {
        ...location,
        name: locationTranslations[req.language]?.name || locationTranslations['en']?.name || '',
        address: locationTranslations[req.language]?.address || locationTranslations['en']?.address || '',
        longitude: location.longitude,
        latitude: location.latitude,
        translations: locationTranslations,
      };
    });
    res.json(locationsWithTranslations);
  } catch (error) {
    console.error('Error fetching all locations with translations:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.fetch_failed', { resource: req.getResource('location', true) })
    });
  }
});

// Get a single location by ID with translations
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const query = `
      SELECT 
        l.*,
        COALESCE(lt1.name, lt2.name) as name,
        COALESCE(lt1.address, lt2.address) as address,
        ST_X(l.position) AS longitude, 
        ST_Y(l.position) AS latitude
      FROM locations l
      LEFT JOIN locations_translations lt1 ON l.id = lt1.location_id AND lt1.language_code = ?
      LEFT JOIN locations_translations lt2 ON l.id = lt2.location_id AND lt2.language_code = 'en'
      WHERE l.id = ?
    `;
    
    const results = await new Promise((resolve, reject) => {
      db.query(query, [req.language, id], (err, results) => {
        if (err) reject(err);
        else resolve(results);
      });
    });

    if (results.length === 0) {
      return res.status(404).json({ 
        error: req.t('errors.resources.not_found', { resource: req.getResource('location') })
      });
    }

    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching location:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.fetch_failed', { resource: req.getResource('location') })
    });
  }
});

router.post('/', authenticateToken, adminProtect, async (req, res) => {
  const { phone, email, image_url, position, translations } = req.body;
  const defaultLanguageCode = req.language;

  // Validation with localized messages
  const validationErrors = [];
  if (!translations || !translations[defaultLanguageCode]?.name) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('name') }));
  }
  if (!translations || !translations[defaultLanguageCode]?.address) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('address') }));
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  let positionValue = null;
  if (position && position.match(/^\s*\(\s*-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\s*\)\s*$/)) {
    const [lat, lon] = position.replace(/[()]/g, '').split(',').map(coord => parseFloat(coord.trim()));
    positionValue = `POINT(${lon} ${lat})`;
  }

  try {
    const [locationResult] = await db.promise().query(
      'INSERT INTO locations (phone, email, image_url, position) VALUES (?, ?, ?, ?)',
      [phone || null, email || null, image_url || null, positionValue]
    );
    const locationId = locationResult.insertId;

    // Insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.name && translations[langCode]?.address) {
        await db.promise().query(
          'INSERT INTO locations_translations (location_id, language_code, name, address) VALUES (?, ?, ?, ?)',
          [locationId, langCode, translations[langCode].name, translations[langCode].address]
        );
      }
    }

    res.status(201).json({ 
      message: req.t('success.resources.created', { resource: req.getResource('location') }),
      id: locationId
    });
  } catch (error) {
    console.error('Error creating location:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.creation_failed', { resource: req.getResource('location') })
    });
  }
});

router.put('/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;
  const { phone, email, image_url, position, translations } = req.body;
  const defaultLanguageCode = req.language;

  // Validation with localized messages
  const validationErrors = [];
  if (!translations || !translations[defaultLanguageCode]?.name) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('name') }));
  }
  if (!translations || !translations[defaultLanguageCode]?.address) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('address') }));
  }

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  let positionValue = null;
  if (position && position.match(/^\s*\(\s*-?\d+\.?\d*\s*,\s*-?\d+\.?\d*\s*\)\s*$/)) {
    const [lat, lon] = position.replace(/[()]/g, '').split(',').map(coord => parseFloat(coord.trim()));
    positionValue = `POINT(${lon} ${lat})`;
  }

  try {
    // Update main location
    const [updateLocationResult] = await db.promise().query(
      'UPDATE locations SET phone = ?, email = ?, image_url = ?, position = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [phone || null, email || null, image_url || null, positionValue, id]
    );

    if (updateLocationResult.affectedRows === 0) {
      return res.status(404).json({ 
        error: req.t('errors.resources.not_found', { resource: req.getResource('location') })
      });
    }

    // Update or insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.name && translations[langCode]?.address) {
        const [translationExists] = await db.promise().query(
          'SELECT id FROM locations_translations WHERE location_id = ? AND language_code = ?',
          [id, langCode]
        );

        if (translationExists.length > 0) {
          // Update existing translation
          await db.promise().query(
            'UPDATE locations_translations SET name = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE location_id = ? AND language_code = ?',
            [translations[langCode].name, translations[langCode].address, id, langCode]
          );
        } else {
          // Insert new translation
          await db.promise().query(
            'INSERT INTO locations_translations (location_id, language_code, name, address) VALUES (?, ?, ?, ?)',
            [id, langCode, translations[langCode].name, translations[langCode].address]
          );
        }
      }
    }

    res.json({ 
      message: req.t('success.resources.updated', { resource: req.getResource('location') })
    });
  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.update_failed', { resource: req.getResource('location') })
    });
  }
});

router.delete('/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;

  try {
    // Deleting from the main locations table will cascade delete from locations_translations
    const [result] = await db.promise().query('DELETE FROM locations WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ 
        error: req.t('errors.resources.not_found', { resource: req.getResource('location') })
      });
    }

    res.json({ 
      message: req.t('success.resources.deleted', { resource: req.getResource('location') })
    });
  } catch (error) {
    console.error('Error deleting location:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.deletion_failed', { resource: req.getResource('location') })
    });
  }
});

module.exports = router;
