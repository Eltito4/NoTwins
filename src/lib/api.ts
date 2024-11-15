import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.MODE === 'production' 
  ? 'https://notwins.onrender.com/api'
  : 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

// Request interceptor with retry logic
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor with enhanced error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Retry the request if it failed due to network issues
    if (error.message === 'Network Error' && !originalRequest._retry) {
      originalRequest._retry = true;
      return api(originalRequest);
    }

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
    return Promise.reject(error);
  }
);

export default api;