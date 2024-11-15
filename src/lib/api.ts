import axios from 'axios';
import toast from 'react-hot-toast';

const isDevelopment = import.meta.env.MODE === 'development';
const API_URL = isDevelopment 
  ? 'http://localhost:3001/api'
  : 'https://notwins.onrender.com/api';

if (!API_URL) {
  console.error('API_URL is not configured');
}

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor with environment-specific error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
      toast.error('Session expired. Please login again.');
    } else if (error.response?.status === 403) {
      toast.error('Access denied');
    } else if (error.response?.status === 404) {
      toast.error('Resource not found');
    } else if (error.response?.status === 500) {
      toast.error('Server error. Please try again later.');
    } else if (!error.response) {
      toast.error('Network error. Please check your connection.');
    }

    // Log detailed errors in development
    if (isDevelopment) {
      console.error('API Error:', {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config,
        message: error.message
      });
    }

    return Promise.reject(error);
  }
);

export default api;