// frontend/src/config/index.js
import axios, { AxiosError } from 'axios';

import i18n from '../i18n';

interface ServerError {
  error: string;
}
// Safely access import.meta.env
const env = import.meta.env || {};
const isProduction = env.MODE === 'production';

// Force localhost in dev mode to avoid connecting to production by mistake
const apiBaseUrl = isProduction
  ? (env.VITE_BACKEND_BASE_URL || 'https://babobambo.com/api/v3')
  : 'http://localhost:5001/api/v3';

// Create Axios instance with base URL
const axiosInstance = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
});



// Add Authorization and Language headers
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Add language header
  config.headers['Accept-Language'] = i18n.language;
  return config;
});


// Generic error handling function
const errorResponse = (error: AxiosError<ServerError>) => {

  const axiosError = error as AxiosError<ServerError>;
  if (axiosError.response && axiosError.response.data && axiosError.response.data.error == "Access denied. No authentication token provided.") {
    console.log('unauth - authentication error, handled by AuthContext');
    // Don't reload here - let AuthContext handle the redirect
    // location.reload();
  }

  if (error && error.response && error.response.data && error.response.data.error) {
    // Assuming 'location' is available in the current context (e.g., browser environment)
    console.error("Axios error with structured data:", error); // DEBUG - removed reload
    // location.reload(); // Don't auto-reload, let components handle appropriately
  } else {
    console.error("An unexpected Axios error occurred:", error);
    // Optionally, handle the error in a different way, like displaying a user-friendly message.
    // For example:
    // alert('An unexpected error occurred. Please try again.');
  }
  return Promise.reject(error); // Propagate the error
};


// Add a response interceptor for error handling
axiosInstance.interceptors.response.use(
  (response) => response, // Do nothing on success
  (error: AxiosError<ServerError>) => {
    return errorResponse(error); // Handle errors
  }
);



// Configuration object
const config = {
  useSupabase: env.VITE_USE_SUPABASE === 'true' || false, // Convert string to boolean, default to false
  enableSessionTimeout: env.VITE_ENABLE_SESSION_TIMEOUT === 'true' || true, // Enable session timeout by default
  stripePublishableKey: env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51SnCcBHESo6ilS6rK5foKr8nepQHXGsA0ejp5k76zptAltVmXzXtbMwAo7KVHdpotyRR8nUJY1nDtIG4duvjqjay00LEbx8OF1',
  // stripePublishableKey: env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_51SnCcPHJCu1f3QDfwTHhA9LfqLgQ3OrKo5BUABX6okdIiwkb4A9h6YbcnH0CxfuUAbz3qVjdo5WZu9EVgQwiEz6l008bpB5Izm',
  backendBaseUrl: apiBaseUrl,
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
  currency: 'euro',
  currencySymbol: '€',
};

export default config;
