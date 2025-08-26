// frontend/src/config/index.js
import axios, { AxiosError } from 'axios';

interface ServerError {
  error: string;
}
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


// Generic error handling function
const errorResponse = (error: AxiosError<ServerError>) => {
    
    const axiosError = error as  AxiosError<ServerError>;
    if (axiosError.response && axiosError.response.data && axiosError.response.data.error == "Access denied. No authentication token provided.") {
          console.log('unauth');

            location.reload();
    }
  
  if (error && error.response && error.response.data && error.response.data.error) {
    // Assuming 'location' is available in the current context (e.g., browser environment)
    console.error("Axios error with structured data, reloading:", error); //DEBUG
    // location.reload();
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
