// routes/products.js
const express = require('express');
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth');
const router = express.Router();

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

// Admin: Get all products with translations
router.get('/admin', authenticateToken, adminProtect, async (req, res) => {
  const languageCode = req.language;
  try {
    const [results] = await db.promise().query(
      `SELECT p.id, pt.name, pt.description, p.image_url, p.retail_price, p.wholesale_price, p.retail_specs, p.wholesale_specs, p.created_at, p.updated_at
       FROM products p
       LEFT JOIN products_translations pt ON p.id = pt.product_id AND pt.language_code = ?
       ORDER BY p.created_at DESC`,
      [languageCode]
    );
    res.json(results);
  } catch (error) {
    console.error('Error fetching all products:', error);
    res.status(500).json({ error: 'Failed to fetch all products' });
  }
});

router.post('/', authenticateToken, adminProtect, async (req, res) => {
  const { name, description, image_url, retail_price, wholesale_price, retail_specs, wholesale_specs } = req.body;
  const languageCode = req.language;

  // Validation
  if (!name || !retail_price || !wholesale_price) {
    return res.status(400).json({ error: 'Name, retail price, and wholesale price are required' });
  }
  if (isNaN(parseFloat(retail_price)) || isNaN(parseFloat(wholesale_price))) {
    return res.status(400).json({ error: 'Invalid price format' });
  }

  try {
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

    await db.promise().query(
      'INSERT INTO products_translations (product_id, language_code, name, description) VALUES (?, ?, ?, ?)',
      [productId, languageCode, name, description || null]
    );

    res.status(201).json({ message: 'Product created successfully', id: productId });
  } catch (error) {
    console.error('Error creating product:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

router.put('/:id', authenticateToken, adminProtect, async (req, res) => {
  const { id } = req.params;
  const { name, description, image_url, retail_price, wholesale_price, retail_specs, wholesale_specs } = req.body;
  const languageCode = req.language;

  // Validation
  if (!name || !retail_price || !wholesale_price) {
    return res.status(400).json({ error: 'Name, retail price, and wholesale price are required' });
  }
  if (isNaN(parseFloat(retail_price)) || isNaN(parseFloat(wholesale_price))) {
    return res.status(400).json({ error: 'Invalid price format' });
  }

  try {
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
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if translation exists for the given language
    const [translationExists] = await db.promise().query(
      'SELECT id FROM products_translations WHERE product_id = ? AND language_code = ?',
      [id, languageCode]
    );

    if (translationExists.length > 0) {
      // Update existing translation
      await db.promise().query(
        'UPDATE products_translations SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE product_id = ? AND language_code = ?',
        [name, description || null, id, languageCode]
      );
    } else {
      // Insert new translation
      await db.promise().query(
        'INSERT INTO products_translations (product_id, language_code, name, description) VALUES (?, ?, ?, ?)',
        [id, languageCode, name, description || null]
      );
    }

    res.json({ message: 'Product updated successfully' });
  } catch (error) {
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
