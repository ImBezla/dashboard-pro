import axios from 'axios';
import { API_BASE_URL } from './api-base-url';

/**
 * Erlaubt absolute URLs (https://api.example.com) oder relative Pfade (z. B. /api),
 * wenn API hinter demselben Origin via Reverse-Proxy hängt.
 */
const API_URL = API_BASE_URL;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
  withCredentials: false, // CORS credentials
});

// Add token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Handle auth errors and network errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Network error (server not reachable)
    if (!error.response && error.request) {
      console.error('Network Error: Server not reachable at', API_URL);
      if (typeof window !== 'undefined') {
        // Don't redirect on network errors, just log
        console.error('Please ensure the API server is running on port 3002');
      }
    }
    
    // Nicht bei Login/Register usw. umleiten — sonst wirkt es wie „nichts passiert“
    // und Fehlermeldungen gehen verloren (voller Reload).
    if (error.response?.status === 401) {
      const reqUrl = String(error.config?.url ?? '');
      const skipAuthRedirect =
        reqUrl.includes('/auth/login') ||
        reqUrl.includes('/auth/register') ||
        reqUrl.includes('/auth/verify-email') ||
        reqUrl.includes('/auth/resend-verification') ||
        reqUrl.includes('/auth/forgot-password') ||
        reqUrl.includes('/auth/reset-password');
      if (!skipAuthRedirect && typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;

