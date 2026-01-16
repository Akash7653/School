import axios from 'axios';

const API_BASE_URL = `${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login for protected routes (not for public API endpoints like /chat)
    const isPublicEndpoint = error.config?.url?.includes('/chat');
    
    if (error.response?.status === 401 && !isPublicEndpoint) {
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;