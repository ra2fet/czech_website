import axios, { AxiosError } from 'axios';
import i18n from '../i18n';

interface ApiError {
  error: string;
}

const instance = axios.create({
  // baseURL: 'http://localhost:5001/api',  local api aaaaaa
  baseURL: 'https://babobambo.com/api/v2',
});

// Add request interceptor to include language header
instance.interceptors.request.use((config) => {
  // Set Accept-Language header based on current language
  config.headers['Accept-Language'] = i18n.language;

  // Add auth token if available
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

instance.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    if (error.response?.data?.error === 'Invalid token. Please log in again.') {
      console.error('Invalid token, redirecting to login.');
      localStorage.removeItem('token');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    else if (error.response?.data?.error === 'Access denied. No authentication token provided.') {
      console.error('Access denied, redirecting to login.');
      localStorage.removeItem('token');
      if (window.location.pathname.startsWith('/admin')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

export default instance;
