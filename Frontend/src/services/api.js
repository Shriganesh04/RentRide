import axios from 'axios';

// Use environment variable with proper fallback
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';


console.log('🔗 API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, 
});


api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Endpoints where a 401 means "wrong credentials", not "your session died" —
// these must NOT trigger the global logout/redirect, or the sign-in page
// would get yanked away before it can show the actual error to the user.
const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/register',
  '/auth/firebase-login',
  '/auth/firebase-register',
  '/auth/firebase-google',
  '/auth/verify-firebase-token',
];

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthEndpoint = AUTH_ENDPOINTS.some((path) =>
      error.config?.url?.includes(path)
    );

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/signin';
    }
    return Promise.reject(error);
  }
);

export default api;