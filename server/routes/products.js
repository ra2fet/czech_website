// routes/products.js
const express = require('express');
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure Multer for file uploads
// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Navigate up from routes/ to server root, then to uploads/
    const uploadDir = path.join(__dirname, '../uploads');
    // Ensure directory exists
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Sanitize filename and append timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper to parse JSON fields if they are strings (from FormData)
const parseJsonField = (field) => {
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      return field;
    }
  }
  return field;
};

// Get all products with translations for the current language
router.get('/', async (req, res) => {
  const languageCode = req.language;
  try {
    const [results] = await db.promise().query(
      `SELECT p.id, pt.name, pt.description, p.image_url, p.retail_price, p.wholesale_price, p.retail_specs, p.wholesale_specs, p.created_at, p.updated_at
       FROM products p
       JOIN products_translations pt ON p.id = pt.product_id
       WHERE pt.language_code = ?
       ORDER BY p.created_at DESC`,
      [languageCode]
    );
    res.json(results);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get single product by ID with translations
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  const languageCode = req.language;

  try {
    const [results] = await db.promise().query(
      `SELECT p.id, pt.name, pt.description, p.image_url, p.retail_price, p.wholesale_price, p.retail_specs, p.wholesale_specs, p.created_at, p.updated_at
       FROM products p
       JOIN products_translations pt ON p.id = pt.product_id
       WHERE p.id = ? AND pt.language_code = ?`,
      [id, languageCode]
    );

    if (results.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(results[0]);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Admin: Get all products with all translations
router.get('/admin', authenticateToken, adminProtect, async (req, res) => {
  try {
    const [products] = await db.promise().query('SELECT * FROM products ORDER BY created_at DESC');
    const [translations] = await db.promise().query('SELECT * FROM products_translations');

    const productsWithTranslations = products.map((product) => {
      const productTranslations = {};

      translations.forEach((t) => {
        if (t.product_id === product.id) {
          productTranslations[t.language_code] = { name: t.name, description: t.description };
        }
      });

      return {
        ...product,
        name: productTranslations[req.language]?.name || productTranslations['en']?.name || '',
        description: productTranslations[req.language]?.description || productTranslations['en']?.description || '',
        translations: productTranslations,
      };
    });

    res.json(productsWithTranslations);
  } catch (error) {
    console.error('Error fetching all products with translations:', error);
    res.status(500).json({ error: 'Failed to fetch all products' });
  }
});

router.post('/', authenticateToken, adminProtect, upload.single('image'), async (req, res) => {
  const { retail_price, wholesale_price } = req.body;
  let { translations, retail_specs, wholesale_specs } = req.body;

  // Parse JSON fields from FormData
  translations = parseJsonField(translations);
  retail_specs = parseJsonField(retail_specs);
  wholesale_specs = parseJsonField(wholesale_specs);

  const defaultLanguageCode = req.language;

  // Validation
  if (!translations || !translations[defaultLanguageCode]?.name || !retail_price || !wholesale_price) {
    return res.status(400).json({ error: 'Name (default language), retail price, and wholesale price are required' });
  }

  // Determine image URL
  let image_url = req.body.image_url;
  if (req.file) {
    image_url = '/uploads/' + req.file.filename;
  }

  try {
    await db.promise().beginTransaction();

    const [productResult] = await db.promise().query(
      'INSERT INTO products (image_url, retail_price, wholesale_price, retail_specs, wholesale_specs) VALUES (?, ?, ?, ?, ?)',
      [
        image_url || null,
        parseFloat(retail_price),
        parseFloat(wholesale_price),
        retail_specs ? JSON.stringify(retail_specs) : null,
        wholesale_specs ? JSON.stringify(wholesale_specs) : null
      ]
    );
    const productId = productResult.insertId;

    // Insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.name) {
        await db.promise().query(
          'INSERT INTO products_translations (product_id, language_code, name, description) VALUES (?, ?, ?, ?)',
          [productId, langCode, translations[langCode].name, translations[langCode].description || null]
        );
      }
    }

    await db.promise().commit();
    res.status(201).json({ message: 'Product created successfully', id: productId });
  } catch (error) {
    await db.promise().rollback();
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', authenticateToken, adminProtect, upload.single('image'), async (req, res) => {
  const { id } = req.params;
  const { retail_price, wholesale_price } = req.body;
  let { translations, retail_specs, wholesale_specs } = req.body;

  // Parse JSON fields from FormData
  translations = parseJsonField(translations);
  retail_specs = parseJsonField(retail_specs);
  wholesale_specs = parseJsonField(wholesale_specs);

  const defaultLanguageCode = req.language;

  // Validation
  if (!translations || !translations[defaultLanguageCode]?.name || !retail_price || !wholesale_price) {
    return res.status(400).json({ error: 'Name (default language), retail price, and wholesale price are required' });
  }

  // Determine image URL
  let image_url = req.body.image_url;
  if (req.file) {
    image_url = '/uploads/' + req.file.filename;
  }

  try {
    await db.promise().beginTransaction();

    // Update main product
    const [updateProductResult] = await db.promise().query(
      'UPDATE products SET image_url = ?, retail_price = ?, wholesale_price = ?, retail_specs = ?, wholesale_specs = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [
        image_url || null,
        parseFloat(retail_price),
        parseFloat(wholesale_price),
        retail_specs ? JSON.stringify(retail_specs) : null,
        wholesale_specs ? JSON.stringify(wholesale_specs) : null,
        id
      ]
    );

    if (updateProductResult.affectedRows === 0) {
      await db.promise().rollback();
      return res.status(404).json({ error: 'Product not found' });
    }

    // Update or insert translations for all provided languages
    for (const langCode in translations) {
      if (translations[langCode]?.name) {
        const [translationExists] = await db.promise().query(
          'SELECT id FROM products_translations WHERE product_id = ? AND language_code = ?',
          [id, langCode]
        );

        if (translationExists.length > 0) {
          // Update existing translation
          await db.promise().query(
            'UPDATE products_translations SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND language_code = ?',
            [translations[langCode].name, translations[langCode].description || null, id, langCode]
          );
        } else {
          // Insert new translation
          await db.promise().query(
            'INSERT INTO products_translations (product_id, language_code, name, description) VALUES (?, ?, ?, ?)',
            [id, langCode, translations[langCode].name, translations[langCode].description || null]
          );
        }
      }
    }

    await db.promise().commit();
    res.json({ message: 'Product updated successfully' });
  } catch (error) {
    await db.promise().rollback();
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

router.delete('/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;

  try {
    // Deleting from the main products table will cascade delete from products_translations
    const [result] = await db.promise().query('DELETE FROM products WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

module.exports = router;
