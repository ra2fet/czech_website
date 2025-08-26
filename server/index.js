// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import route handlers
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');
const locationRoutes = require('./routes/locations');
const productRoutes = require('./routes/products');
const contactRoutes = require('./routes/contact');
const faqRoutes = require('./routes/faqs');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const addressRoutes = require('./routes/user_addresses');
const taxFeeRoutes = require('./routes/taxFees');
const shippingRateRoutes = require('./routes/shippingRates');
const couponCodeRoutes = require('./routes/couponCodes');
const provinceRoutes = require('./routes/provinces');
const offerRoutes = require('./routes/offers');
const announcementRoutes = require('./routes/announcements');
const ratingRoutes = require('./routes/ratings'); // Import the new ratings route
const userRoutes = require('./routes/users'); // Import the new users route
const newsletterRoutes = require('./routes/newsletter'); // Import the new newsletter route
const initRatingEmailScheduler = require('./cron/ratingEmailScheduler'); // Import the scheduler

const app = express();

// Initialize scheduled tasks
initRatingEmailScheduler();

// Middleware
app.use(cors({
  origin:'*',
  // origin: process.env.NODE_ENV === 'production'
  //   ? process.env.FRONTEND_PRODUCTION_URL || 'https://babonederland.com'
  //   :  process.env.FRONTEND_LOCAL_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Serve static files from the 'uploads' directory
// Use path.join and __dirname for a more robust path resolution
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/products', productRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/faqs', faqRoutes); 
app.use('/api/orders', orderRoutes); 
app.use('/api/admin', adminRoutes);
app.use('/api/user_addresses', addressRoutes);
app.use('/api/tax-fees', taxFeeRoutes);
app.use('/api/shipping-rates', shippingRateRoutes);
app.use('/api/coupon-codes', couponCodeRoutes);
app.use('/api/provinces', provinceRoutes);
app.use('/api/offers', offerRoutes); 
app.use('/api/announcements', announcementRoutes);
app.use('/api/ratings', ratingRoutes); // Use the new ratings route
app.use('/api/users', userRoutes); // Use the new users route
app.use('/api/newsletter', newsletterRoutes); // Use the new newsletter route

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'An unexpected error occurred' });
});

// Start Server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
