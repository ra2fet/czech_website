import axios, { AxiosError } from 'axios';

interface ApiError {
  error: string;
}

const instance = axios.create({
  baseURL: 'http://localhost:5001/api',
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
   else  if (error.response?.data?.error === 'Access denied. No authentication token provided.') {
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
