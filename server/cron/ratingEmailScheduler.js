const cron = require('node-cron');
const { sendRatingEmail } = require('../utils/emailService');
const db = require('../config/db');

const initRatingEmailScheduler = () => {
  cron.schedule('0 0 * * *', () => { // Runs daily at midnight
    console.log('Running daily cron job for rating emails...');
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    const query = `
      SELECT o.id AS orderId, u.email AS userEmail, o.rating_token
      FROM orders o
      JOIN users u ON o.user_id = u.id
      WHERE o.send_rating_email_date <= ? AND o.rating_email_sent = FALSE;
    `;

    db.query(query, [today], (err, orders) => {
      if (err) {
        console.error('Error fetching orders for rating emails:', err);
        return;
      }

      // Process orders sequentially to avoid too many concurrent email sends/DB updates
      const processOrder = (index) => {
        if (index >= orders.length) {
          return; // All orders processed
        }

        const order = orders[index];
        const ratingLink = `${process.env.FRONTEND_URL}/rate-order/${order.rating_token}`;

        sendRatingEmail(order.userEmail, order.orderId, ratingLink)
          .then((emailSent) => {
            if (emailSent) {
              db.query(
                'UPDATE orders SET rating_email_sent = TRUE WHERE id = ?',
                [order.orderId],
                (updateErr) => {
                  if (updateErr) {
                    console.error(`Error updating rating_email_sent for order ${order.orderId}:`, updateErr);
                  }
                  processOrder(index + 1); // Process next order
                }
              );
            } else {
              processOrder(index + 1); // Process next order even if email failed
            }
          })
          .catch((emailSendErr) => {
            console.error(`Unhandled error during email send for order ${order.orderId}:`, emailSendErr);
            processOrder(index + 1); // Process next order on unhandled error
          });
      };

      processOrder(0); // Start processing from the first order
    });
  });
};

module.exports = initRatingEmailScheduler;
