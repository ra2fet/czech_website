// frontend/src/config/index.js
import axios from 'axios';

// Safely access import.meta.env
const env = import.meta.env || {};
const isProduction = env.MODE === 'production';

// Create Axios instance with base URL
const axiosInstance = axios.create({
  baseURL: env.VITE_BACKEND_BASE_URL || (isProduction ? 'https://your-production-api.com/api' : 'http://localhost:5001/api'),
  headers: { 'Content-Type': 'application/json' },
});

// Add Authorization header with JWT token
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


// Configuration object
const config = {
  useSupabase: env.VITE_USE_SUPABASE === 'true' || false, // Convert string to boolean, default to false
  backendBaseUrl: env.VITE_BACKEND_BASE_URL || (isProduction ? 'https://your-production-api.com/api' : 'http://localhost:5001/api'),
  apiEndpoints: {
    auth: {
      signin: '/auth/signin',
      signout: '/auth/signout',
    },
    blogs: '/blogs',
    locations: '/locations',
    products: '/products',
    messages: '/contact/messages',
    applications: '/contact/applications',
    faqs: '/faqs',
    orders: '/orders'
  },
  axios: axiosInstance,
};

export default config;
