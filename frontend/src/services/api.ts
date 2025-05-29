import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  config => {
    // Get token from localStorage
    const token = localStorage.getItem('token');

    // If token exists, add it to the headers
    if (token) {
      // Fix TypeScript error by ensuring headers exists
      if (!config.headers) {
        config.headers = {};
      }
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, config.params || config.data);
    return config;
  },
  error => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
api.interceptors.response.use(
  response => {
    console.log(`API Response: ${response.status}`, response.data);
    return response;
  },
  error => {
    console.error('API Response Error:', error.response?.data || error.message);

    // Handle 401 errors (unauthorized/token expired)
    if (error.response && error.response.status === 401) {
      console.log('Authentication error - token expired or invalid');

      // Clear expired token and user data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        console.log('Redirecting to login page');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
