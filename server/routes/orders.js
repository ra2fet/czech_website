const express = require('express');
const router = express.Router();
const db = require('../config/db'); // Assuming you have a db connection

// Route to create a new order
router.post('/', (req, res) => {
    const { fullName, email, phoneNumber, address, cartItems } = req.body;

    if (!fullName || !cartItems || cartItems.length === 0) {
        return res.status(400).json({ message: 'Missing required order information.' });
    }

    db.beginTransaction((err) => {
        if (err) {
            console.error('Error starting transaction:', err);
            return res.status(500).json({ message: 'Failed to create order', error: err.message });
        }

        let calculatedTotalAmount = 0;
        const validatedCartItems = [];
        let itemsProcessed = 0;

        const processCartItem = (index) => {
            if (index >= cartItems.length) {
                // All items processed, proceed with order insertion
                db.query(
                    'INSERT INTO orders (full_name, email, phone_number, address, total_amount, payment_status) VALUES (?, ?, ?, ?, ?, ?)',
                    [fullName, email, phoneNumber, address, calculatedTotalAmount, 'completed'],
                    (err, orderResult) => {
                        if (err) {
                            db.rollback(() => {
                                console.error('Error inserting order, rolling back:', err);
                                res.status(500).json({ message: 'Failed to create order', error: err.message });
                            });
                            return;
                        }

                        const orderId = orderResult.insertId;
                        let orderItemsInserted = 0;

                        if (validatedCartItems.length === 0) {
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

                        validatedCartItems.forEach((item) => {
                            db.query(
                                'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
                                [orderId, item.productId, item.quantity, item.price],
                                (err) => {
                                    if (err) {
                                        db.rollback(() => {
                                            console.error('Error inserting order item, rolling back:', err);
                                            res.status(500).json({ message: 'Failed to create order', error: err.message });
                                        });
                                        return;
                                    }
                                    orderItemsInserted++;
                                    if (orderItemsInserted === validatedCartItems.length) {
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
                    }
                );
                return;
            }

            const item = cartItems[index];
            // Assuming item.type is provided in the cartItems (e.g., 'retail' or 'wholesale')
            // If not provided, it defaults to retail price.
            const priceColumn = item.type === 'wholesale' ? 'wholesale_price' : 'retail_price';

            db.query(`SELECT id, ${priceColumn} as price, name FROM products WHERE id = ?`, [item.id], (err, products) => {
                if (err) {
                    db.rollback(() => {
                        console.error('Error fetching product for validation, rolling back:', err);
                        res.status(500).json({ message: 'Failed to create order', error: err.message });
                    });
                    return;
                }

                if (products.length === 0) {
                    db.rollback(() => {
                        console.error(`Product with ID ${item.id} not found, rolling back.`);
                        res.status(400).json({ message: `Product with ID ${item.id} not found.` });
                    });
                    return;
                }

                const product = products[0];
                const itemPrice = parseFloat(product.price); // This 'price' now comes from either retail_price or wholesale_price
                const itemQuantity = parseInt(item.quantity);

                if (isNaN(itemPrice) || isNaN(itemQuantity) || itemQuantity <= 0) {
                    db.rollback(() => {
                        console.error(`Invalid price or quantity for product ID ${item.id}, rolling back.`);
                        res.status(400).json({ message: `Invalid price or quantity for product ID ${item.id}.` });
                    });
                    return;
                }

                calculatedTotalAmount += itemPrice * itemQuantity;
                validatedCartItems.push({
                    productId: product.id,
                    quantity: itemQuantity,
                    price: itemPrice,
                    productName: product.name
                });

                processCartItem(index + 1); // Process next item
            });
        };

        processCartItem(0); // Start processing from the first item
    });
});

// Route to get all orders (for admin panel)
router.get('/', (req, res) => {
    db.query('SELECT * FROM orders ORDER BY order_date DESC', (err, orders) => {
        if (err) {
            console.error('Error fetching orders:', err);
            return res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
        }

        if (orders.length === 0) {
            return res.status(200).json([]);
        }

        let ordersProcessed = 0;
        orders.forEach((order) => {
            db.query(
                'SELECT oi.*, p.name as product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = ?',
                [order.id],
                (err, items) => {
                    if (err) {
                        console.error('Error fetching order items:', err);
                        // Decide how to handle this error: skip order, return 500, etc.
                        // For now, we'll just log and continue, but a more robust error handling might be needed.
                        order.items = []; // Assign empty array if items can't be fetched
                    } else {
                        order.items = items;
                    }
                    ordersProcessed++;
                    if (ordersProcessed === orders.length) {
                        res.status(200).json(orders);
                    }
                }
            );
        });
    });
});

module.exports = router;
