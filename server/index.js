// server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import i18n middleware
const { detectLanguage, setLanguageHeaders } = require('./middleware/i18n');

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
const languageRoutes = require('./routes/languages'); // Import the languages route
const featureSettingsRoutes = require('./routes/featureSettings');

const initRatingEmailScheduler = require('./cron/ratingEmailScheduler'); // Import the scheduler

const app = express();

// Initialize scheduled tasks
initRatingEmailScheduler();

// Middleware
app.use(cors({
  origin: '*',
  // origin: process.env.NODE_ENV === 'production'
  //   ? process.env.FRONTEND_PRODUCTION_URL || 'https://babonederland.com'
  //   :  process.env.FRONTEND_LOCAL_URL || 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language']
}));
app.use(express.json());

// Apply i18n middleware globally
app.use(detectLanguage);
app.use(setLanguageHeaders);

// Serve static files from the 'uploads' directory
// Use path.join and __dirname for a more robust path resolution
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const API_VERSION = 'v2';

// Routes
app.use(`/api/${API_VERSION}/auth`, authRoutes);
app.use(`/api/${API_VERSION}/blogs`, blogRoutes);
app.use(`/api/${API_VERSION}/locations`, locationRoutes);
app.use(`/api/${API_VERSION}/products`, productRoutes);
app.use(`/api/${API_VERSION}/contact`, contactRoutes);
app.use(`/api/${API_VERSION}/faqs`, faqRoutes);
app.use(`/api/${API_VERSION}/orders`, orderRoutes);
app.use(`/api/${API_VERSION}/admin`, adminRoutes);
app.use(`/api/${API_VERSION}/user_addresses`, addressRoutes);
app.use(`/api/${API_VERSION}/tax-fees`, taxFeeRoutes);
app.use(`/api/${API_VERSION}/shipping-rates`, shippingRateRoutes);
app.use(`/api/${API_VERSION}/coupon-codes`, couponCodeRoutes);
app.use(`/api/${API_VERSION}/provinces`, provinceRoutes);
app.use(`/api/${API_VERSION}/offers`, offerRoutes);
app.use(`/api/${API_VERSION}/announcements`, announcementRoutes);
app.use(`/api/${API_VERSION}/ratings`, ratingRoutes); // Use the new ratings route
app.use(`/api/${API_VERSION}/users`, userRoutes); // Use the new users route
app.use(`/api/${API_VERSION}/newsletter`, newsletterRoutes); // Use the new newsletter route
app.use(`/api/${API_VERSION}/languages`, languageRoutes); // Use the languages route
app.use(`/api/${API_VERSION}/feature-settings`, featureSettingsRoutes);


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
