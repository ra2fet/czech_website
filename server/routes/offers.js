const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth');

// GET all active offers (for public display)
router.get('/', async (req, res) => {
  const query = `
    SELECT o.*, p.id AS product_id, p.name AS product_name, p.retail_price AS product_price, p.image_url AS product_image_url
    FROM offers o
    JOIN product_offers po ON o.id = po.offer_id
    JOIN products p ON po.product_id = p.id
    WHERE o.is_active = TRUE AND o.start_date <= NOW() AND o.end_date >= NOW()
    ORDER BY o.start_date DESC;
  `;
  try {
    const [results] = await db.promise().query(query);

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
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// GET all offers (for admin panel)
router.get('/admin', authenticateToken, adminProtect, async (req, res) => {
  const query = `
    SELECT o.*, p.id AS product_id, p.name AS product_name, p.retail_price AS product_price, p.image_url AS product_image_url
    FROM offers o
    LEFT JOIN product_offers po ON o.id = po.offer_id
    LEFT JOIN products p ON po.product_id = p.id
    ORDER BY o.created_at DESC;
  `;
  try {
    const [results] = await db.promise().query(query);

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
      if (row.product_id) { // Only push product if it exists
        offersMap.get(row.id).products.push({
          id: row.product_id,
          name: row.product_name,
          price: row.product_price,
          image_url: row.product_image_url
        });
      }
    });
    res.json(Array.from(offersMap.values()));
  } catch (err) {
    console.error('Error fetching all offers for admin:', err);
    res.status(500).json({ error: 'Failed to fetch offers' });
  }
});

// POST create a new offer (admin only)
router.post('/', authenticateToken, adminProtect, (req, res) => {
  const { name, description, discount_type, discount_value, start_date, end_date, product_ids } = req.body;

  if (!name || !discount_type || !discount_value || !start_date || !end_date) {
    return res.status(400).json({ message: 'Missing required offer fields.' });
  }

  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ message: 'Failed to create offer', error: err.message });
    }

    const offerQuery = `
      INSERT INTO offers (name, description, discount_type, discount_value, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    const offerValues = [name, description || null, discount_type, discount_value, start_date, end_date];

    db.query(offerQuery, offerValues, (err, offerResult) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error inserting offer, rolling back:', err);
          res.status(500).json({ message: 'Failed to create offer', error: err.message });
        });
      }

      const offerId = offerResult.insertId;

      if (product_ids && product_ids.length > 0) {
        const productOfferValues = product_ids.map(productId => [offerId, productId]);
        const productOfferQuery = 'INSERT INTO product_offers (offer_id, product_id) VALUES ?';
        db.query(productOfferQuery, [productOfferValues], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error inserting product offers, rolling back:', err);
              res.status(500).json({ message: 'Failed to create offer', error: err.message });
            });
          }
          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                console.error('Error committing transaction, rolling back:', commitErr);
                res.status(500).json({ message: 'Failed to create offer', error: commitErr.message });
              });
            }
            res.status(201).json({ message: 'Offer created successfully', offerId });
          });
        });
      } else {
        db.commit((commitErr) => {
          if (commitErr) {
            return db.rollback(() => {
              console.error('Error committing transaction (no products), rolling back:', commitErr);
              res.status(500).json({ message: 'Failed to create offer', error: commitErr.message });
            });
          }
          res.status(201).json({ message: 'Offer created successfully', offerId });
        });
      }
    });
  });
});

// PUT update an existing offer (admin only)
router.put('/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;
  const { name, description, discount_type, discount_value, start_date, end_date, is_active, product_ids } = req.body;

  if (!name || !discount_type || !discount_value || !start_date || !end_date) {
    return res.status(400).json({ message: 'Missing required offer fields.' });
  }

  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ message: 'Failed to update offer', error: err.message });
    }

    const offerQuery = `
      UPDATE offers
      SET name = ?, description = ?, discount_type = ?, discount_value = ?, start_date = ?, end_date = ?, is_active = ?
      WHERE id = ?
    `;
    const offerValues = [name, description || null, discount_type, discount_value, start_date, end_date, is_active, id];

    db.query(offerQuery, offerValues, (err, offerResult) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error updating offer, rolling back:', err);
          res.status(500).json({ message: 'Failed to update offer', error: err.message });
        });
      }

      if (offerResult.affectedRows === 0) {
        return db.rollback(() => res.status(404).json({ message: 'Offer not found.' }));
      }

      // Update product_offers
      db.query('DELETE FROM product_offers WHERE offer_id = ?', [id], (err) => {
        if (err) {
          return db.rollback(() => {  
            console.error('Error deleting old product offers, rolling back:', err);
            res.status(500).json({ message: 'Failed to update offer', error: err.message });
          });
        }

        if (product_ids && product_ids.length > 0) {
          const productOfferValues = product_ids.map(productId => [id, productId]);
          const productOfferQuery = 'INSERT INTO product_offers (offer_id, product_id) VALUES ?';
          db.query(productOfferQuery, [productOfferValues], (err) => {
            if (err) {
              return db.rollback(() => {
                console.error('Error inserting new product offers, rolling back:', err);
                res.status(500).json({ message: 'Failed to update offer', error: err.message });
              });
            }
            db.commit((commitErr) => {
              if (commitErr) {
                return db.rollback(() => {
                  console.error('Error committing transaction, rolling back:', commitErr);
                  res.status(500).json({ message: 'Failed to update offer', error: commitErr.message });
                });
              }
              res.status(200).json({ message: 'Offer updated successfully' });
            });
          });
        } else {
          db.commit((commitErr) => {
            if (commitErr) {
              return db.rollback(() => {
                console.error('Error committing transaction (no products), rolling back:', commitErr);
                res.status(500).json({ message: 'Failed to update offer', error: commitErr.message });
              });
            }
            res.status(200).json({ message: 'Offer updated successfully' });
          });
        }
      });
    });
  });
});

// DELETE an offer (admin only)
router.delete('/:id', authenticateToken, adminProtect, (req, res) => {
  const { id } = req.params;

  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).json({ message: 'Failed to delete offer', error: err.message });
    }

    // Delete from product_offers first due to foreign key constraints
    db.query('DELETE FROM product_offers WHERE offer_id = ?', [id], (err) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error deleting product offers, rolling back:', err);
          res.status(500).json({ message: 'Failed to delete offer', error: err.message });
        });
      }

      db.query('DELETE FROM offers WHERE id = ?', [id], (err, offerResult) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error deleting offer, rolling back:', err);
            res.status(500).json({ message: 'Failed to delete offer', error: err.message });
          });
        }

        if (offerResult.affectedRows === 0) {
          return db.rollback(() => res.status(404).json({ message: 'Offer not found.' }));
        }

        db.commit((commitErr) => {
          if (commitErr) {
            return db.rollback(() => {
              console.error('Error committing transaction, rolling back:', commitErr);
              res.status(500).json({ message: 'Failed to delete offer', error: commitErr.message });
            });
          }
          res.status(200).json({ message: 'Offer deleted successfully' });
        });
      });
    });
  });
});

module.exports = router;
