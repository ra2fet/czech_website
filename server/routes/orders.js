const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Assuming you have a db connection
const { authenticateToken, adminProtect } = require('../middleware/auth'); // Import auth middleware
const { v4: uuidv4 } = require('uuid'); // Import uuid for generating unique tokens

// Helper function to check if a feature is enabled
const isFeatureEnabled = async (featureName) => {
    try {
        const [settings] = await db.promise().query('SELECT * FROM feature_settings WHERE id = 1');
        if (settings.length > 0) {
            return settings[0][featureName] === 1 || settings[0][featureName] === true;
        }
        return true; // Default to enabled if no settings found
    } catch (error) {
        console.error('Error checking feature setting:', error);
        return true; // Default to enabled on error
    }
};


// Route to get a single order by orderId (for RatingPage) - Requires authentication
router.get('/single/:orderId', authenticateToken, (req, res) => {
    const { orderId } = req.params;
    const userId = req.user.id; // Authenticated user's ID

    const query = `
        SELECT o.*, ua.street_name, ua.house_number, ua.city, pt.name AS province, ua.postcode, ua.address_name
        FROM orders o
        LEFT JOIN user_addresses ua ON o.address_id = ua.id
        LEFT JOIN provinces p ON ua.province_id = p.id
        LEFT JOIN provinces_translations pt ON p.id = pt.province_id AND pt.language_code = ?
        WHERE o.id = ? AND o.user_id = ?
    `;

    db.query(query, [req.language || 'en', orderId, userId], (err, orders) => {
        if (err) {
            console.error('Error fetching single order:', err);
            return res.status(500).json({ message: 'Failed to fetch order details', error: err.message });
        }

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found or you do not have access to it.' });
        }

        const order = orders[0];

        db.query(
            'SELECT oi.*, pt.name as product_name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN products_translations pt ON p.id = pt.product_id WHERE oi.order_id = ? AND pt.language_code = ?',
            [order.id, req.language || 'en'],
            (err, items) => {
                if (err) {
                    console.error('Error fetching order items for single order:', err);
                    order.items = [];
                } else {
                    order.items = items;
                }
                res.status(200).json(order);
            }
        );
    });
});

// Public route to get a single order by ratingToken (for RatingPage without auth)
router.get('/public-single-by-token/:ratingToken', async (req, res) => {
    // Check if rating system is enabled
    const ratingEnabled = await isFeatureEnabled('enableOrderRating');
    if (!ratingEnabled) {
        return res.status(403).json({ message: 'Order rating feature is currently disabled' });
    }

    const { ratingToken } = req.params;

    const query = `
        SELECT o.id, o.order_date, o.total_amount, o.rating_token_used,
               ua.street_name, ua.house_number, ua.city, pt.name AS province, ua.postcode, ua.address_name
        FROM orders o
        LEFT JOIN user_addresses ua ON o.address_id = ua.id
        LEFT JOIN provinces p ON ua.province_id = p.id
        LEFT JOIN provinces_translations pt ON p.id = pt.province_id AND pt.language_code = ?
        WHERE o.rating_token = ?
    `;

    db.query(query, [req.language || 'en', ratingToken], (err, orders) => {
        if (err) {
            console.error('Error fetching public single order by token:', err);
            return res.status(500).json({ message: 'Failed to fetch order details', error: err.message });
        }

        if (orders.length === 0) {
            return res.status(404).json({ message: 'Order not found or invalid rating token.' });
        }

        const order = orders[0];

        if (order.rating_token_used) {
            return res.status(409).json({ message: 'This order has already been rated.' });
        }

        db.query(
            'SELECT oi.*, pt.name as product_name, p.image_url FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN products_translations pt ON p.id = pt.product_id WHERE oi.order_id = ? AND pt.language_code = ?',
            [order.id, req.language || 'en'],
            (err, items) => {
                if (err) {
                    console.error('Error fetching order items for public single order by token:', err);
                    order.items = [];
                } else {
                    order.items = items;
                }
                res.status(200).json(order);
            }
        );
    });
});


// Route to create a new order (Public to allow guest checkout)
router.post('/', async (req, res) => {
    // Check if order creation is enabled (assuming this feature exists)
    // const orderCreationEnabled = await isFeatureEnabled('enableOrderCreation');
    // if (!orderCreationEnabled) {
    //     return res.status(403).json({ message: 'Order creation is currently disabled' });
    // }

    const { userId: bodyUserId, totalAmount, addressId: bodyAddressId, cartItems, guestInfo, guestAddress } = req.body;

    // We either need a userId and addressId (authenticated) OR guestInfo and guestAddress (guest)
    if ((!bodyUserId && !guestInfo) || !totalAmount || (!bodyAddressId && !guestAddress) || !cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: 'Missing required order information.' });
    }

    db.beginTransaction(async (err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ message: 'Failed to create order', error: err.message });
        }

        try {
            let finalUserId = bodyUserId;
            let finalAddressId = bodyAddressId;

            // Handle Guest Logic
            if (!finalUserId && guestInfo) {
                // Check if user exists by email
                const [existingUsers] = await db.promise().query('SELECT id FROM users WHERE email = ?', [guestInfo.email]);

                if (existingUsers.length > 0) {
                    finalUserId = existingUsers[0].id;
                } else {
                    // Create new guest user
                    // We generate a random password for guests or set a flag if possible. 
                    // Using a random placeholder password since it's required.
                    const randomPassword = Math.random().toString(36).slice(-8);
                    const bcrypt = require('bcrypt');
                    const hashedPassword = await bcrypt.hash(randomPassword, 10);

                    const [newUserResult] = await db.promise().query(
                        'INSERT INTO users (full_name, email, password, user_type, is_active, is_verified, phone_number) VALUES (?, ?, ?, ?, ?, ?, ?)',
                        [guestInfo.name, guestInfo.email, hashedPassword, 'guest', false, false, guestInfo.phone || '']
                    );
                    finalUserId = newUserResult.insertId;
                }
            }

            // Handle Guest Address Logic
            if (!finalAddressId && guestAddress && finalUserId) {
                // Create address for the user (guest or existing)
                const [newAddressResult] = await db.promise().query(
                    'INSERT INTO user_addresses (user_id, address_name, city, province_id, street_name, house_number, postcode) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [finalUserId, guestAddress.address_name || 'Guest Address', guestAddress.city, guestAddress.province_id, guestAddress.street_name, guestAddress.house_number, guestAddress.postcode]
                );
                finalAddressId = newAddressResult.insertId;
            }

            if (!finalUserId || !finalAddressId) {
                throw new Error('Failed to determine user or address for order.');
            }

            // Check if rating features are enabled
            const ratingEnabled = await isFeatureEnabled('enableOrderRating');
            const autoEmailEnabled = await isFeatureEnabled('enableAutoRatingEmail');
            const send3DaysEnabled = await isFeatureEnabled('enableRatingLinkAfter3Days');

            // Generate rating token only if rating system is enabled
            const ratingToken = ratingEnabled ? uuidv4() : null;

            // Calculate send date only if auto rating emails are enabled
            let sendRatingEmailDate = null;
            if (ratingEnabled && autoEmailEnabled) {
                sendRatingEmailDate = new Date();
                const daysToAdd = send3DaysEnabled ? 3 : 1;
                sendRatingEmailDate.setDate(sendRatingEmailDate.getDate() + daysToAdd);
            }

            // Insert order into the orders table
            const orderQuery = `
                INSERT INTO orders (user_id, total_amount, address_id, payment_status, rating_token, send_rating_email_date)
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            const orderValues = [
                finalUserId,
                totalAmount,
                finalAddressId,
                'completed',
                ratingToken,
                sendRatingEmailDate ? sendRatingEmailDate.toISOString().split('T')[0] : null // Format as YYYY-MM-DD or null
            ];

            db.query(orderQuery, orderValues, (err, orderResult) => {
                if (err) {
                    db.rollback(() => {
                        console.error('Error inserting order, rolling back:', err);
                        res.status(500).json({ message: 'Failed to create order', error: err.message });
                    });
                    return;
                }

                const orderId = orderResult.insertId;
                let orderItemsInserted = 0;

                if (cartItems.length === 0) {
                    db.commit((commitErr) => {
                        if (commitErr) {
                            db.rollback(() => {
                                console.error('Error committing transaction (no items), rolling back:', commitErr);
                                res.status(500).json({ message: 'Failed to create order', error: commitErr.message });
                            });
                        } else {
                            res.status(201).json({ message: 'Order created successfully', orderId });
                        }
                    });
                    return;
                }

                cartItems.forEach((item) => {
                    db.query(
                        'INSERT INTO order_items (order_id, product_id, quantity, price, product_type) VALUES (?, ?, ?, ?, ?)',
                        [orderId, item.productId, item.quantity, item.price, item.type],
                        (err) => {
                            if (err) {
                                db.rollback(() => {
                                    console.error('Error inserting order item, rolling back:', err);
                                    res.status(500).json({ message: 'Failed to create order', error: err.message });
                                });
                                return;
                            }
                            orderItemsInserted++;
                            if (orderItemsInserted === cartItems.length) {
                                db.commit((commitErr) => {
                                    if (commitErr) {
                                        db.rollback(() => {
                                            console.error('Error committing transaction, rolling back:', commitErr);
                                            res.status(500).json({ message: 'Failed to create order', error: commitErr.message });
                                        });
                                    } else {
                                        res.status(201).json({ message: 'Order created successfully', orderId });
                                    }
                                });
                            }
                        }
                    );
                });
            });
        } catch (error) {
            db.rollback(() => {
                console.error('Error in order creation:', error);
                res.status(500).json({ message: 'Failed to create order', error: error.message });
            });
        }
    });
});

// Route to get orders for a specific user
router.get('/:userId', authenticateToken, (req, res) => {
    const { userId } = req.params;

    // Ensure the authenticated user matches the userId in the URL or is an admin
    if (req.user.id !== parseInt(userId) && req.user.userType !== 'admin') {
        return res.status(403).json({ message: 'Access denied.' });
    }

    const query = `
        SELECT o.*,u.full_name, ua.street_name, ua.house_number, ua.city, pt.name AS province, ua.postcode, ua.address_name
        FROM orders o
        LEFT JOIN user_addresses ua ON o.address_id = ua.id
        LEFT JOIN provinces p ON ua.province_id = p.id
        LEFT JOIN provinces_translations pt ON p.id = pt.province_id AND pt.language_code = ?
        LEFT JOIN users u ON o.user_id = u.id
        WHERE o.user_id = ?
        ORDER BY o.order_date DESC
    `;

    db.query(query, [req.language || 'en', userId], (err, orders) => {
        if (err) {
            console.error('Error fetching user orders:', err);
            return res.status(500).json({ message: 'Failed to fetch user orders', error: err.message });
        }

        if (orders.length === 0) {
            return res.status(200).json([]);
        }

        let ordersProcessed = 0;
        orders.forEach((order) => {
            // Fetch order items
            db.query(
                'SELECT oi.*, pt.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN products_translations pt ON p.id = pt.product_id WHERE oi.order_id = ? AND pt.language_code = ?',
                [order.id, req.language || 'en'],
                (err, items) => {
                    if (err) {
                        console.error('Error fetching order items:', err);
                        order.items = [];
                    } else {
                        order.items = items;
                    }

                    // Fetch ratings for the current order
                    db.query(
                        'SELECT * FROM order_ratings WHERE order_id = ?',
                        [order.id],
                        (err, ratings) => {
                            if (err) {
                                console.error('Error fetching order ratings:', err);
                                order.ratings = [];
                            } else {
                                order.ratings = ratings;
                            }

                            ordersProcessed++;
                            if (ordersProcessed === orders.length) {
                                res.status(200).json(orders);
                            }
                        }
                    );
                }
            );
        });
    });
});

// Route to get all orders (for admin panel)
router.get('/', authenticateToken, adminProtect, (req, res) => {
    // Ensure only admins can access this route - this is now handled by adminProtect middleware
    // if (req.user.userType !== 'admin') {
    //     return res.status(403).json({ message: 'Access denied. Admins only.' });
    // }

    const query = `
        SELECT o.*,u.full_name, u.email as user_email, ua.street_name, ua.house_number, ua.city, pt.name AS province, ua.postcode, ua.address_name
        FROM orders o
        JOIN users u ON o.user_id = u.id
        LEFT JOIN user_addresses ua ON o.address_id = ua.id
        LEFT JOIN provinces p ON ua.province_id = p.id
        LEFT JOIN provinces_translations pt ON p.id = pt.province_id AND pt.language_code = ?
        ORDER BY o.order_date DESC
    `;

    db.query(query, [req.language || 'en'], (err, orders) => {
        if (err) {
            console.error('Error fetching all orders:', err);
            return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
        }

        if (orders.length === 0) {
            return res.status(200).json([]);
        }

        let ordersProcessed = 0;
        orders.forEach((order) => {
            // Fetch order items
            db.query(
                'SELECT oi.*, pt.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id JOIN products_translations pt ON p.id = pt.product_id WHERE oi.order_id = ? AND pt.language_code = ?',
                [order.id, req.language || 'en'],
                (err, items) => {
                    if (err) {
                        console.error('Error fetching order items:', err);
                        order.items = [];
                    } else {
                        order.items = items;
                    }

                    // Fetch ratings for the current order
                    db.query(
                        'SELECT * FROM order_ratings WHERE order_id = ?',
                        [order.id],
                        (err, ratings) => {
                            if (err) {
                                console.error('Error fetching order ratings:', err);
                                order.ratings = [];
                            } else {
                                order.ratings = ratings;
                            }

                            ordersProcessed++;
                            if (ordersProcessed === orders.length) {
                                res.status(200).json(orders);
                            }
                        }
                    );
                }
            );
        });
    });
});

module.exports = router;
