// routes/products.js
const express = require('express');
const db = require('../config/db');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

router.get('/', (req, res) => {
  db.query('SELECT * FROM products ORDER BY created_at DESC', (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      return res.status(500).json({ error: 'Failed to fetch products' });
    }
    res.json(results);
  });
});

router.post('/', authenticateToken, (req, res) => {
  const { name, description, image_url, retail_price, wholesale_price, retail_specs, wholesale_specs } = req.body;

  if (!name || !retail_price || !wholesale_price) {
    return res.status(400).json({ error: 'Name, retail price, and wholesale price are required' });
  }

  db.query(
    'INSERT INTO products (name, description, image_url, retail_price, wholesale_price, retail_specs, wholesale_specs) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [
      name,
      description || null,
      image_url || null,
      parseFloat(retail_price),
      parseFloat(wholesale_price),
      retail_specs ? JSON.stringify(retail_specs) : null,
      wholesale_specs ? JSON.stringify(wholesale_specs) : null
    ],
    (err, result) => {
      if (err) {
        console.error('Error creating product:', err);
        return res.status(500).json({ error: 'Failed to create product' });
      }
      res.status(201).json({ message: 'Product created successfully', id: result.insertId });
    }
  );
});

router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, description, image_url, retail_price, wholesale_price, retail_specs, wholesale_specs } = req.body;

  if (!name || !retail_price || !wholesale_price) {
    return res.status(400).json({ error: 'Name, retail price, and wholesale price are required' });
  }

  db.query(
    'UPDATE products SET name = ?, description = ?, image_url = ?, retail_price = ?, wholesale_price = ?, retail_specs = ?, wholesale_specs = ? WHERE id = ?',
    [
      name,
      description || null,
      image_url || null,
      parseFloat(retail_price),
      parseFloat(wholesale_price),
      retail_specs ? JSON.stringify(retail_specs) : null,
      wholesale_specs ? JSON.stringify(wholesale_specs) : null,
      id
    ],
    (err, result) => {
      if (err) {
        console.error('Error updating product:', err);
        return res.status(500).json({ error: 'Failed to update product' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Product not found' });
      }
      res.json({ message: 'Product updated successfully' });
    }
  );
});

router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM products WHERE id = ?', [id], (err, result) => {
    if (err) {
      console.error('Error deleting product:', err);
      return res.status(500).json({ error: 'Failed to delete product' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json({ message: 'Product deleted successfully' });
  });
});

module.exports = router;