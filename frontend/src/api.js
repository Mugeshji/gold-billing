import axios from 'axios';

const api = axios.create({
  baseURL: 'https://gold-billings.onrender.com/api',
});

// Add an interceptor to automatically add JWT token to all requests if it exists in local storage
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

export default api;
