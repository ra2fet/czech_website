const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Route to submit order and product ratings
router.post('/', (req, res) => {
    const { orderId, ratingToken, overallRating, overallComment, productRatings } = req.body;


    // const userId = req.user.id; // Assuming userId is available from authenticateToken middleware

    if (!orderId || !ratingToken || !overallRating || !productRatings) {
        return res.status(400).json({ message: 'Missing required rating information.' });
    }

    db.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ message: 'Failed to submit ratings', error: err.message });
        }

        // 1. Validate the rating token and check if it's already used
        db.query(
            'SELECT id, user_id, rating_token_used FROM orders WHERE id = ? AND rating_token = ?',
            [orderId, ratingToken],
            (err, orders) => {
                if (err) {
                    db.rollback(() => {
                        console.error('Error validating rating token, rolling back:', err);
                        res.status(500).json({ message: 'Failed to submit ratings', error: err.message });
                    });
                    return;
                }

                if (orders.length === 0) {
                    db.rollback(() => {
                        res.status(404).json({ message: 'Order or rating token not found or invalid.' });
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
                        res.status(409).json({ message: 'This rating link has already been used.' });
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
                                res.status(500).json({ message: 'Failed to submit ratings', error: err.message });
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
                                            res.status(500).json({ message: 'Failed to submit ratings', error: err.message });
                                        });
                                        return;
                                    }
                                    db.commit((commitErr) => {
                                        if (commitErr) {
                                            db.rollback(() => {
                                                console.error('Error committing transaction (no product ratings), rolling back:', commitErr);
                                                res.status(500).json({ message: 'Failed to submit ratings', error: commitErr.message });
                                            });
                                        } else {
                                            res.status(200).json({ message: 'Ratings submitted successfully!' });
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
                                            res.status(500).json({ message: 'Failed to submit ratings', error: err.message });
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
                                                        res.status(500).json({ message: 'Failed to submit ratings', error: err.message });
                                                    });
                                                    return;
                                                }
                                                db.commit((commitErr) => {
                                                    if (commitErr) {
                                                        db.rollback(() => {
                                                            console.error('Error committing transaction, rolling back:', commitErr);
                                                            res.status(500).json({ message: 'Failed to submit ratings', error: commitErr.message });
                                                        });
                                                    } else {
                                                        res.status(200).json({ message: 'Ratings submitted successfully!' });
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
