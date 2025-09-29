/**
 * API Utilities
 * 
 * Helper functions for working with API endpoints
 */

import { API_CONFIG } from '../config/apiConfig';
import axios from 'axios';

// Determine if API logging is enabled
const isLoggingEnabled = () => {
  if (import.meta.env.VITE_API_LOGGING === 'false') return false;
  return import.meta.env.DEV || import.meta.env.VITE_API_LOGGING === 'true';
};

/**
 * Get the full URL for an API endpoint
 * @param {string} endpoint - The endpoint path (with or without leading slash)
 * @returns {string} - The complete URL with base URL and endpoint
 */
export const getApiUrl = (endpoint) => {
  // Remove /api prefix if it exists in the endpoint (to avoid duplication)
  let cleanEndpoint = endpoint;
  if (cleanEndpoint && cleanEndpoint.startsWith('/api/')) {
    cleanEndpoint = cleanEndpoint.substring(4); // Remove /api prefix
  }
  
  // Ensure endpoint starts with a slash if not empty and not already starting with one
  const formattedEndpoint = cleanEndpoint 
    ? (cleanEndpoint.startsWith('/') ? cleanEndpoint : `/${cleanEndpoint}`)
    : '';
  
  const fullUrl = `${API_CONFIG.BASE_URL}${formattedEndpoint}`;
  
  // Log URL in development mode
  if (isLoggingEnabled()) {
    console.log(`🔗 API URL: ${fullUrl}`);
  }
  
  return fullUrl;
};

/**
 * Get headers for API requests, including authentication if token exists
 * @param {Object} additionalHeaders - Additional headers to include
 * @returns {Object} - Headers object with Content-Type and Authorization if available
 */
export const getApiHeaders = (additionalHeaders = {}) => {
  const token = localStorage.getItem('token');
  
  const headers = {
    'Content-Type': 'application/json',
    ...additionalHeaders
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

/**
 * Create an axios instance with default configuration
 * @returns {Object} - Configured axios instance
 */
export const createApiClient = () => {
  const client = axios.create({
    baseURL: API_CONFIG.BASE_URL,
    timeout: API_CONFIG.TIMEOUT,
    headers: getApiHeaders()
  });
  
  // Add request interceptor for logging
  if (isLoggingEnabled()) {
    client.interceptors.request.use(
      (config) => {
        console.log(`🚀 API Request: ${config.method.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ API Request Error:', error);
        return Promise.reject(error);
      }
    );
    
    client.interceptors.response.use(
      (response) => {
        console.log(`✅ API Response: ${response.status} from ${response.config.url}`);
        return response;
      },
      (error) => {
        if (error.response) {
          console.error(`❌ API Error ${error.response.status}: ${error.response.data?.message || error.message}`);
        } else {
          console.error('❌ API Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }
  
  return client;
};

export default {
  getApiUrl,
  getApiHeaders,
  createApiClient
};
