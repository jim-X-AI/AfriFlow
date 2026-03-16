// FILE: frontend/src/api/client.js

import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
});

const token = localStorage.getItem('afriflow_token');
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
}

api.interceptors.response.use(
  res => res,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('afriflow_token');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default api;