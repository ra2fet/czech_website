// server.js
const express = require('express');
const cors = require('cors');
const path = require('path'); // Import the 'path' module
require('dotenv').config();

// Import route handlers
const authRoutes = require('./routes/auth');
const blogRoutes = require('./routes/blogs');
const locationRoutes = require('./routes/locations');
const productRoutes = require('./routes/products');
const contactRoutes = require('./routes/contact');
const faqRoutes = require('./routes/faqs'); // Import the new FAQ routes
const orderRoutes = require('./routes/orders'); // Import the new order routes

const app = express();

// Middleware
app.use(cors({
  origin:'*',
  // origin: process.env.NODE_ENV === 'production'
  //   ? process.env.FRONTEND_PRODUCTION_URL || 'https://your-frontend-domain.com'
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
app.use('/api/faqs', faqRoutes); // Use the new FAQ routes
app.use('/api/orders', orderRoutes); // Use the new order routes

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
