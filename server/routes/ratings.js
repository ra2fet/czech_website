const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Route to submit order and product ratings
router.post('/', (req, res) => {
    const { orderId, ratingToken, overallRating, overallComment, productRatings } = req.body;

    // Validation with localized messages
    const validationErrors = [];
    if (!orderId) validationErrors.push(req.t('errors.validation.required', { field: 'Order ID' }));
    if (!ratingToken) validationErrors.push(req.t('errors.validation.required', { field: 'Rating Token' }));
    if (!overallRating) validationErrors.push(req.t('errors.validation.required', { field: 'Overall Rating' }));
    if (!productRatings) validationErrors.push(req.t('errors.validation.required', { field: 'Product Ratings' }));

    if (validationErrors.length > 0) {
        return res.status(400).json({ errors: validationErrors });
    }

    db.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ error: req.t('errors.database.transaction_failed') });
        }

        // 1. Validate the rating token and check if it's already used
        db.query(
            'SELECT id, user_id, rating_token_used FROM orders WHERE id = ? AND rating_token = ?',
            [orderId, ratingToken],
            (err, orders) => {
                if (err) {
                    db.rollback(() => {
                        console.error('Error validating rating token, rolling back:', err);
                        res.status(500).json({ error: req.t('errors.database.query_failed') });
                    });
                    return;
                }

                if (orders.length === 0) {
                    db.rollback(() => {
                        res.status(404).json({ error: req.t('errors.resources.not_found', { resource: 'Order or rating token' }) });
                    });
                    return;
                }

                const order = orders[0];


                // if (order.user_id !== userId) {
                //     db.rollback(() => {
                //         res.status(403).json({ message: 'Access denied. You can only rate your own orders.' });
                //     });
                //     return;
                // }

                const userId = order.user_id; // Get userId from the order

                if (order.rating_token_used) {
                    db.rollback(() => {
                        res.status(409).json({ error: req.t('errors.resources.already_exists', { resource: 'Rating submission' }) });
                    });
                    return;
                }

                // 2. Insert overall order rating
                db.query(
                    'INSERT INTO order_ratings (order_id, user_id, rating, comment) VALUES (?, ?, ?, ?)',
                    [orderId, userId, overallRating, overallComment],
                    (err) => {
                        if (err) {
                            db.rollback(() => {
                                console.error('Error inserting overall rating, rolling back:', err);
                                res.status(500).json({ error: req.t('errors.database.query_failed') });
                            });
                            return;
                        }

                        let productRatingsInserted = 0;
                        if (productRatings.length === 0) {
                            // If no product ratings, proceed to mark token as used
                            db.query(
                                'UPDATE orders SET rating_token_used = TRUE WHERE id = ?',
                                [orderId],
                                (err) => {
                                    if (err) {
                                        db.rollback(() => {
                                            console.error('Error marking rating token as used, rolling back:', err);
                                            res.status(500).json({ error: req.t('errors.database.query_failed') });
                                        });
                                        return;
                                    }
                                    db.commit((commitErr) => {
                                        if (commitErr) {
                                            db.rollback(() => {
                                                console.error('Error committing transaction (no product ratings), rolling back:', commitErr);
                                                res.status(500).json({ error: req.t('errors.database.transaction_failed') });
                                            });
                                        } else {
                                            res.status(200).json({ message: req.t('success.resources.created', { resource: req.getResource('rating', true) }) });
                                        }
                                    });
                                }
                            );
                            return;
                        }

                        // 3. Insert individual product ratings
                        productRatings.forEach((productRating) => {
                            db.query(
                                'INSERT INTO order_ratings (order_id, user_id, product_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
                                [orderId, userId, productRating.productId, productRating.rating, productRating.comment || null],
                                (err) => {
                                    if (err) {
                                        db.rollback(() => {
                                            console.error('Error inserting product rating, rolling back:', err);
                                            res.status(500).json({ error: req.t('errors.database.query_failed') });
                                        });
                                        return;
                                    }
                                    productRatingsInserted++;
                                    if (productRatingsInserted === productRatings.length) {
                                        // 4. Mark the rating token as used
                                        db.query(
                                            'UPDATE orders SET rating_token_used = TRUE WHERE id = ?',
                                            [orderId],
                                            (err) => {
                                                if (err) {
                                                    db.rollback(() => {
                                                        console.error('Error marking rating token as used, rolling back:', err);
                                                        res.status(500).json({ error: req.t('errors.database.query_failed') });
                                                    });
                                                    return;
                                                }
                                                db.commit((commitErr) => {
                                                    if (commitErr) {
                                                        db.rollback(() => {
                                                            console.error('Error committing transaction, rolling back:', commitErr);
                                                            res.status(500).json({ error: req.t('errors.database.transaction_failed') });
                                                        });
                                                    } else {
                                                        res.status(200).json({ message: req.t('success.resources.created', { resource: req.getResource('rating', true) }) });
                                                    }
                                                });
                                            }
                                        );
                                    }
                                }
                            );
                        });
                    }
                );
            }
        );
    });
});

module.exports = router;
