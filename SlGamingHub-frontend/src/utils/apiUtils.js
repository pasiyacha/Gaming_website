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
  // Ensure we have a clean base URL
  const baseURL = API_CONFIG.BASE_URL;
  console.log('Creating API client with base URL:', baseURL);
  
  const client = axios.create({
    baseURL: baseURL,
    timeout: API_CONFIG.TIMEOUT,
    headers: getApiHeaders(),
    withCredentials: true // Enable credentials for CORS
  });
  
  // Add request interceptor for logging and debugging
  client.interceptors.request.use(
    (config) => {
      // Ensure the URL is properly constructed
      const fullUrl = config.baseURL + (config.url || '');
      
      if (isLoggingEnabled()) {
        console.log(`🚀 API Request: ${config.method.toUpperCase()} ${fullUrl}`);
        console.log('Request headers:', config.headers);
      }
      
      // Verify the URL doesn't contain malformed parts
      if (fullUrl.includes(',')) {
        console.error('🚨 Malformed URL detected:', fullUrl);
        throw new Error('Invalid API URL configuration');
      }
      
      return config;
    },
    (error) => {
      console.error('❌ API Request Error:', error);
      return Promise.reject(error);
    }
  );
  
  client.interceptors.response.use(
    (response) => {
      if (isLoggingEnabled()) {
        console.log(`✅ API Response: ${response.status} from ${response.config.url}`);
      }
      return response;
    },
    (error) => {
      if (error.response) {
        console.error(`❌ API Error ${error.response.status}:`, error.response.data?.message || error.message);
        console.error('Response headers:', error.response.headers);
      } else if (error.request) {
        console.error('❌ Network Error - No response received:', error.message);
        console.error('Request config:', error.config);
      } else {
        console.error('❌ Request Setup Error:', error.message);
      }
      return Promise.reject(error);
    }
  );
  
  return client;
};

export default {
  getApiUrl,
  getApiHeaders,
  createApiClient
};
