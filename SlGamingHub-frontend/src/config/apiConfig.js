/**
 * API Configuration File
 * 
 * This file contains the configuration for the API endpoints.
 * You can change the API_BASE_URL to point to your actual API server.
 */

// API Base URL
export const API_CONFIG = {
  // Development URL (used when in development mode)
  DEV_URL: 'http://localhost:5000/api',
  
  // Production URL (used when in production mode) - using domain name for production
  PROD_URL: 'http://slgaminghub.com/api',
  
  // Determines which URL to use based on the environment or environment variables
  get BASE_URL() {
    // First check if a VITE_API_URL environment variable is defined
    if (import.meta.env.VITE_API_URL) {
      return import.meta.env.VITE_API_URL;
    }
    // Otherwise use environment to determine URL
    return import.meta.env.MODE === 'production' ? this.PROD_URL : this.DEV_URL;
  },
  
  // Set to true to use localStorage fallback even if API is available (for development/testing)
  FORCE_FALLBACK: false,
  
  // API Endpoints
  ENDPOINTS: {
    BANKS: '/banks',
    USERS: '/users',
    ORDERS: '/orders',
    ORDER: '/order',    // Add this for backwards compatibility
    PACKAGES: '/packages',
    GAMES: '/games',
    AUTH: '/auth',
    AI: '/ai',          // Claude Sonnet 4 AI endpoints
  },
  
  // API Timeout in milliseconds
  TIMEOUT: 10000,
};

export default API_CONFIG;
