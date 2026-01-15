const express = require('express');
const db = require('../config/db');
const { authenticateToken, adminProtect } = require('../middleware/auth');
const { sendRatingEmail } = require('../utils/emailService'); // Import email service

const router = express.Router();

// Middleware to ensure only admins can access these routes
// router.use(authenticateToken, adminProtect); // Apply authentication and admin protection middleware

// Get all company users (pending and active)
router.get('/companies', (req, res) => {
  const query = `
    SELECT u.id, u.full_name, u.email, u.phone_number, u.user_type, u.is_active, c.company_name, c.license_number
    FROM users u
    JOIN companies c ON u.id = c.user_id
    WHERE u.user_type = 'company'
  `;
  db.query(query, (err, results) => {
    if (err) {
      console.error('Error fetching company users:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// Approve a company account
router.put('/companies/:id/approve', (req, res) => {
  const userId = req.params.id;
  db.query('UPDATE users SET is_active = TRUE WHERE id = ? AND user_type = "company"', [userId], (err, result) => {
    if (err) {
      console.error('Error approving company:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company user not found or already active.' });
    }
    res.json({ message: 'Company account approved.' });
  });
});

// Decline/Deactivate a company account
router.put('/companies/:id/decline', (req, res) => {
  const userId = req.params.id;
  db.query('UPDATE users SET is_active = FALSE WHERE id = ? AND user_type = "company"', [userId], (err, result) => {
    if (err) {
      console.error('Error declining company:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Company user not found.' });
    }
    res.json({ message: 'Company account deactivated.' });
  });
});

// Route to send a test email (admin protected)  [Temporary for testing purpose]
router.post('/test-email', async (req, res) => {
  const { testEmail } = req.body;

  if (!testEmail) {
    return res.status(400).json({ message: 'Test email address is required.' });
  }

  // Use dummy data for orderId and ratingToken for testing purposes
  const dummyOrderId = 99999;
  const dummyRatingToken = 'test-rating-token-12345';
  const dummyRatingLink = `${process.env.FRONTEND_URL}/rate-order/${dummyRatingToken}`;

  try {
    const emailSent = await sendRatingEmail(testEmail, dummyOrderId, dummyRatingLink);
    if (emailSent) {
      res.status(200).json({ message: `Test email sent successfully to ${testEmail}.` });
    } else {
      res.status(500).json({ message: `Failed to send test email to ${testEmail}. Check server logs for details.` });
    }
  } catch (error) {
    console.error('Error in test-email endpoint:', error);
    res.status(500).json({ message: 'An unexpected error occurred while sending test email.' });
  }
});

// Route to manually trigger the rating email cron job logic (admin protected) [Temporary for testing purpose]
router.post('/trigger-rating-cron', async (req, res) => {
  console.log('Manually triggering rating email cron job logic...');
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  const query = `
    SELECT o.id AS orderId, u.email AS userEmail, o.rating_token
    FROM orders o
    JOIN users u ON o.user_id = u.id
    WHERE o.send_rating_email_date <= ? AND o.rating_email_sent = FALSE;
  `;

  db.query(query, [today], (err, orders) => {
    if (err) {
      console.error('Error fetching orders for rating emails (manual trigger):', err);
      return res.status(500).json({ message: 'Failed to trigger cron job logic: Database error.' });
    }

    if (orders.length === 0) {
      return res.status(200).json({ message: 'No pending rating emails to send at this time.' });
    }

    let emailsSentCount = 0;
    let emailsFailedCount = 0;
    let processedOrders = 0;

    const processOrder = (index) => {
      if (index >= orders.length) {
        console.log(`Manual cron trigger finished. Sent ${emailsSentCount} emails, failed ${emailsFailedCount}.`);
        return res.status(200).json({
          message: `Cron job logic initiated. Attempted to send ${orders.length} emails. Sent: ${emailsSentCount}, Failed: ${emailsFailedCount}.`,
        });
      }

      const order = orders[index];
      const ratingLink = `${process.env.FRONTEND_URL}/rate-order/${order.rating_token}`;

      sendRatingEmail(order.userEmail, order.orderId, ratingLink)
        .then((emailSent) => {
          if (emailSent) {
            emailsSentCount++;
            db.query(
              'UPDATE orders SET rating_email_sent = TRUE WHERE id = ?',
              [order.orderId],
              (updateErr) => {
                if (updateErr) {
                  console.error(`Error updating rating_email_sent for order ${order.orderId}:`, updateErr);
                }
                processedOrders++;
                processOrder(index + 1);
              }
            );
          } else {
            emailsFailedCount++;
            processedOrders++;
            processOrder(index + 1);
          }
        })
        .catch((emailSendErr) => {
          console.error(`Unhandled error during email send for order ${order.orderId}:`, emailSendErr);
          emailsFailedCount++;
          processedOrders++;
          processOrder(index + 1);
        });
    };

    processOrder(0); // Start processing from the first order
  });
});

// New route for dashboard counts
router.get('/dashboard/counts', async (req, res) => {
  try {
    const [productsCount] = await db.promise().query('SELECT COUNT(*) AS count FROM products');
    const [locationsCount] = await db.promise().query('SELECT COUNT(*) AS count FROM locations');
    const [usersCount] = await db.promise().query('SELECT COUNT(*) AS count FROM users');
    const [blogsCount] = await db.promise().query('SELECT COUNT(*) AS count FROM blogs');
    const [messagesCount] = await db.promise().query('SELECT COUNT(*) AS count FROM messages');
    const [applicationsCount] = await db.promise().query('SELECT COUNT(*) AS count FROM job_applications');
    const [ordersCount] = await db.promise().query('SELECT COUNT(*) AS count FROM orders');

    res.json({
      productCount: productsCount[0].count,
      locationCount: locationsCount[0].count,
      userCount: usersCount[0].count,
      blogCount: blogsCount[0].count,
      messageCount: messagesCount[0].count,
      applicationCount: applicationsCount[0].count,
      orderCount: ordersCount[0].count,
    });
  } catch (error) {
    console.error('Error fetching dashboard counts:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

// New route for dashboard statistics
router.get('/dashboard', async (req, res) => {
  const { filter, from_date, to_date } = req.query;
  const languageCode = req.language || 'en';
  let dateCondition = '';
  let dateConditionWithoutWhere = '';

  if (filter === 'Today') {
    dateCondition = 'WHERE DATE(order_date) = CURDATE()';
    dateConditionWithoutWhere = 'AND DATE(order_date) = CURDATE()';
  } else if (filter === 'Yesterday') {
    dateCondition = 'WHERE DATE(order_date) = CURDATE() - INTERVAL 1 DAY';
    dateConditionWithoutWhere = 'AND DATE(order_date) = CURDATE() - INTERVAL 1 DAY';
  } else if (filter === 'This Month') {
    dateCondition = 'WHERE YEAR(order_date) = YEAR(CURDATE()) AND MONTH(order_date) = MONTH(CURDATE())';
    dateConditionWithoutWhere = 'AND YEAR(order_date) = YEAR(CURDATE()) AND MONTH(order_date) = MONTH(CURDATE())';
  } else if (filter === 'This Year') {
    dateCondition = 'WHERE YEAR(order_date) = YEAR(CURDATE())';
    dateConditionWithoutWhere = 'AND YEAR(order_date) = YEAR(CURDATE())';
  } else if (filter === 'Custom Date' && from_date && to_date) {
    dateCondition = `WHERE DATE(order_date) BETWEEN '${from_date}' AND '${to_date}'`;
    dateConditionWithoutWhere = `AND DATE(order_date) BETWEEN '${from_date}' AND '${to_date}'`;
  }

  try {
    // Total Sales
    const totalSalesQuery = `SELECT SUM(total_amount) AS total_sales FROM orders ${dateCondition}`;
    const [totalSalesResult] = await db.promise().query(totalSalesQuery);
    const total_sales = totalSalesResult[0].total_sales || 0;

    // Total Completed Orders
    const totalCompletedOrdersQuery = `SELECT COUNT(*) AS total_completed_orders FROM orders WHERE payment_status = 'completed' ${dateConditionWithoutWhere}`;
    const [totalCompletedOrdersResult] = await db.promise().query(totalCompletedOrdersQuery);
    const total_completed_orders = totalCompletedOrdersResult[0].total_completed_orders || 0;

    // Top Products with translations
    const topProductsQuery = `
      SELECT pt.name AS product_name, SUM(oi.quantity) AS quantity_sold
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN products_translations pt ON p.id = pt.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE pt.language_code = ? ${dateConditionWithoutWhere}
      GROUP BY pt.name
      ORDER BY quantity_sold DESC
      LIMIT 5
    `;
    const [topProductsResult] = await db.promise().query(topProductsQuery, [languageCode]);
    const top_products = topProductsResult;

    // Orders by Month
    const ordersByMonthQuery = `
      SELECT DATE_FORMAT(order_date, '%Y-%m') AS month, COUNT(*) AS count
      FROM orders
      ${dateCondition}
      GROUP BY month
      ORDER BY month
    `;
    const [ordersByMonthResult] = await db.promise().query(ordersByMonthQuery);
    const orders_by_month = ordersByMonthResult;

    // Orders by Branches (provinces) with translations
    const ordersByBranchesQuery = `
      SELECT pt.name AS branch_name, COUNT(o.id) AS count
      FROM orders o
      JOIN user_addresses ua ON o.address_id = ua.id
      JOIN provinces p ON ua.province_id = p.id
      JOIN provinces_translations pt ON p.id = pt.province_id
      WHERE pt.language_code = ? ${dateConditionWithoutWhere}
      GROUP BY pt.name
      ORDER BY count DESC
    `;
    const [ordersByBranchesResult] = await db.promise().query(ordersByBranchesQuery, [languageCode]);
    const orders_by_branches = ordersByBranchesResult;

    // Orders by Clients
    const ordersByClientsQuery = `
      SELECT u.full_name AS client_name, COUNT(o.id) AS count
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE 1=1 ${dateConditionWithoutWhere}
      GROUP BY u.full_name
      ORDER BY count DESC
      LIMIT 5
    `;
    const [ordersByClientsResult] = await db.promise().query(ordersByClientsQuery);
    const orders_by_clients = ordersByClientsResult;

    // Orders by Product (New pie chart data)
    const ordersByProductQuery = `
      SELECT pt.name AS product_name, SUM(oi.quantity) AS count
      FROM order_items oi
      JOIN products p ON oi.product_id = p.id
      JOIN products_translations pt ON p.id = pt.product_id
      JOIN orders o ON oi.order_id = o.id
      WHERE pt.language_code = ? ${dateConditionWithoutWhere}
      GROUP BY pt.name
      ORDER BY count DESC
    `;
    const [ordersByProductResult] = await db.promise().query(ordersByProductQuery, [languageCode]);
    const orders_by_product = ordersByProductResult;

    res.json({
      total_sales,
      total_completed_orders,
      top_products,
      orders_by_month,
      orders_by_branches,
      orders_by_clients,
      orders_by_product
    });

  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    res.status(500).json({ error: 'Database error' });
  }
});

module.exports = router;
