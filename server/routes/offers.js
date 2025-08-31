const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth');

// GET all active offers (for public display) with translations
router.get('/', async (req, res) => {
  const languageCode = req.language;
  const query = `
    SELECT o.id, ot.name, ot.description, o.discount_type, o.discount_value, o.start_date, o.end_date, o.is_active, o.created_at, o.updated_at,
           p.id AS product_id, pt.name AS product_name, p.retail_price AS product_price, p.image_url AS product_image_url
    FROM offers o
    JOIN offers_translations ot ON o.id = ot.offer_id
    JOIN product_offers po ON o.id = po.offer_id
    JOIN products p ON po.product_id = p.id
    JOIN products_translations pt ON p.id = pt.product_id
    WHERE o.is_active = TRUE AND o.start_date <= NOW() AND o.end_date >= NOW() 
    AND ot.language_code = ? AND pt.language_code = ?
    ORDER BY o.start_date DESC;
  `;
  try {
    const [results] = await db.promise().query(query, [languageCode, languageCode]);

    // Group products by offer
    const offersMap = new Map();
    results.forEach(row => {
      if (!offersMap.has(row.id)) {
        offersMap.set(row.id, {
          id: row.id,
          name: row.name,
          description: row.description,
          discount_type: row.discount_type,
          discount_value: row.discount_value,
          start_date: row.start_date,
          end_date: row.end_date,
          is_active: row.is_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
          products: []
        });
      }
      offersMap.get(row.id).products.push({
        id: row.product_id,
        name: row.product_name,
        price: row.product_price,
        image_url: row.product_image_url
      });
    });
    res.json(Array.from(offersMap.values()));
  } catch (err) {
    console.error('Error fetching active offers:', err);
    res.status(500).json({ 
      error: req.t('errors.resources.fetch_failed', { resource: req.getResource('offer', true) })
    });
  }
});

// GET all offers (for admin panel) with all translations
router.get('/admin', authenticateToken, adminProtect, async (req, res) => {
  try {
    const [offers] = await db.promise().query('SELECT * FROM offers ORDER BY created_at DESC');
    const [translations] = await db.promise().query('SELECT * FROM offers_translations');
    const [productOffers] = await db.promise().query(
      `SELECT po.offer_id, p.id, pt.name, p.retail_price, p.image_url 
       FROM product_offers po 
       JOIN products p ON po.product_id = p.id
       JOIN products_translations pt ON p.id = pt.product_id
       WHERE pt.language_code = ?`,
      [req.language]
    );

    const offersWithTranslations = offers.map((offer) => {
      const offerTranslations = {};
      translations.forEach((t) => {
        if (t.offer_id === offer.id) {
          offerTranslations[t.language_code] = { name: t.name, description: t.description };
        }
      });
      
      const products = productOffers
        .filter(po => po.offer_id === offer.id)
        .map(po => ({
          id: po.id,
          name: po.name,
          price: po.retail_price,
          image_url: po.image_url
        }));
      
      return {
        ...offer,
        name: offerTranslations[req.language]?.name || offerTranslations['en']?.name || '',
        description: offerTranslations[req.language]?.description || offerTranslations['en']?.description || '',
        products,
        translations: offerTranslations,
      };
    });
    res.json(offersWithTranslations);
  } catch (err) {
    console.error('Error fetching all offers for admin with translations:', err);
    res.status(500).json({ 
      error: req.t('errors.resources.fetch_failed', { resource: req.getResource('offer', true) })
    });
  }
});

// POST create a new offer (admin only)
router.post('/', authenticateToken, adminProtect, async (req, res) => {
  const { discount_type, discount_value, start_date, end_date, product_ids, translations } = req.body;
  const defaultLanguageCode = req.language;

  // Validation with localized messages
  const validationErrors = [];
  if (!translations || !translations[defaultLanguageCode]?.name) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('name') }));
  }
  if (!discount_type) validationErrors.push(req.t('errors.validation.required', { field: 'Discount type' }));
  if (!discount_value) validationErrors.push(req.t('errors.validation.required', { field: 'Discount value' }));
  if (!start_date) validationErrors.push(req.t('errors.validation.required', { field: 'Start date' }));
  if (!end_date) validationErrors.push(req.t('errors.validation.required', { field: 'End date' }));

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    await db.promise().beginTransaction();

    const [offerResult] = await db.promise().query(
      'INSERT INTO offers (discount_type, discount_value, start_date, end_date) VALUES (?, ?, ?, ?)',
      [discount_type, discount_value, start_date, end_date]
    );
    const offerId = offerResult.insertId;

    // Insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.name) {
        await db.promise().query(
          'INSERT INTO offers_translations (offer_id, language_code, name, description) VALUES (?, ?, ?, ?)',
          [offerId, langCode, translations[langCode].name, translations[langCode].description || null]
        );
      }
    }

    if (product_ids && product_ids.length > 0) {
      const productOfferValues = product_ids.map(productId => [offerId, productId]);
      const productOfferQuery = 'INSERT INTO product_offers (offer_id, product_id) VALUES ?';
      await db.promise().query(productOfferQuery, [productOfferValues]);
    }

    await db.promise().commit();
    res.status(201).json({ 
      message: req.t('success.resources.created', { resource: req.getResource('offer') }),
      id: offerId 
    });
  } catch (error) {
    await db.promise().rollback();
    console.error('Error creating offer:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.creation_failed', { resource: req.getResource('offer') })
    });
  }
});

// PUT update an existing offer (admin only)
router.put('/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;
  const { discount_type, discount_value, start_date, end_date, is_active, product_ids, translations } = req.body;
  const defaultLanguageCode = req.language;

  // Validation with localized messages
  const validationErrors = [];
  if (!translations || !translations[defaultLanguageCode]?.name) {
    validationErrors.push(req.t('errors.validation.required', { field: req.getFieldName('name') }));
  }
  if (!discount_type) validationErrors.push(req.t('errors.validation.required', { field: 'Discount type' }));
  if (!discount_value) validationErrors.push(req.t('errors.validation.required', { field: 'Discount value' }));
  if (!start_date) validationErrors.push(req.t('errors.validation.required', { field: 'Start date' }));
  if (!end_date) validationErrors.push(req.t('errors.validation.required', { field: 'End date' }));

  if (validationErrors.length > 0) {
    return res.status(400).json({ errors: validationErrors });
  }

  try {
    await db.promise().beginTransaction();

    // Update the main offers table
    const [updateOfferResult] = await db.promise().query(
      'UPDATE offers SET discount_type = ?, discount_value = ?, start_date = ?, end_date = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [discount_type, discount_value, start_date, end_date, is_active, id]
    );

    if (updateOfferResult.affectedRows === 0) {
      await db.promise().rollback();
      return res.status(404).json({ 
        error: req.t('errors.resources.not_found', { resource: req.getResource('offer') })
      });
    }

    // Update or insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.name) {
        const [translationExists] = await db.promise().query(
          'SELECT id FROM offers_translations WHERE offer_id = ? AND language_code = ?',
          [id, langCode]
        );

        if (translationExists.length > 0) {
          // Update existing translation
          await db.promise().query(
            'UPDATE offers_translations SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE offer_id = ? AND language_code = ?',
            [translations[langCode].name, translations[langCode].description || null, id, langCode]
          );
        } else {
          // Insert new translation
          await db.promise().query(
            'INSERT INTO offers_translations (offer_id, language_code, name, description) VALUES (?, ?, ?, ?)',
            [id, langCode, translations[langCode].name, translations[langCode].description || null]
          );
        }
      }
    }

    // Update product_offers
    await db.promise().query('DELETE FROM product_offers WHERE offer_id = ?', [id]);

    if (product_ids && product_ids.length > 0) {
      const productOfferValues = product_ids.map(productId => [id, productId]);
      const productOfferQuery = 'INSERT INTO product_offers (offer_id, product_id) VALUES ?';
      await db.promise().query(productOfferQuery, [productOfferValues]);
    }

    await db.promise().commit();
    res.status(200).json({ 
      message: req.t('success.resources.updated', { resource: req.getResource('offer') })
    });
  } catch (error) {
    await db.promise().rollback();
    console.error('Error updating offer:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.update_failed', { resource: req.getResource('offer') })
    });
  }
});

// DELETE an offer (admin only)
router.delete('/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;

  try {
    await db.promise().beginTransaction();

    // Deleting from the main offers table will cascade delete from offers_translations and product_offers
    const [result] = await db.promise().query('DELETE FROM offers WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      await db.promise().rollback();
      return res.status(404).json({ 
        error: req.t('errors.resources.not_found', { resource: req.getResource('offer') })
      });
    }

    await db.promise().commit();
    res.status(200).json({ 
      message: req.t('success.resources.deleted', { resource: req.getResource('offer') })
    });
  } catch (error) {
    await db.promise().rollback();
    console.error('Error deleting offer:', error);
    res.status(500).json({ 
      error: req.t('errors.resources.deletion_failed', { resource: req.getResource('offer') })
    });
  }
});

module.exports = router;
