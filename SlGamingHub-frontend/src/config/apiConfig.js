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
    // HOTFIX: Force correct URL for production to prevent malformed URL issues
    if (typeof window !== 'undefined' && window.location.hostname === 'slgaminghub.com') {
      console.log('🔧 HOTFIX: Forcing production API URL for slgaminghub.com');
      return 'http://slgaminghub.com/api';
    }
    
    // First check if a VITE_API_URL environment variable is defined
    let apiUrl = import.meta.env.VITE_API_URL;
    
    // Clean up the API URL to ensure it doesn't contain invalid characters or multiple URLs
    if (apiUrl) {
      // Remove any CORS origins that might have been accidentally included
      apiUrl = apiUrl.split(',')[0].trim();
      
      // Additional validation to prevent malformed URLs
      if (apiUrl.includes(',')) {
        console.error('🚨 Detected malformed API URL with commas:', apiUrl);
        console.log('🔧 Using fallback URL instead');
        return import.meta.env.MODE === 'production' ? this.PROD_URL : this.DEV_URL;
      }
      
      // Ensure the URL is properly formatted
      if (apiUrl && (apiUrl.startsWith('http://') || apiUrl.startsWith('https://'))) {
        console.log('✅ Using environment API URL:', apiUrl);
        return apiUrl;
      }
    }
    
    // Otherwise use environment to determine URL
    const fallbackUrl = import.meta.env.MODE === 'production' ? this.PROD_URL : this.DEV_URL;
    console.log('📍 Using fallback API URL:', fallbackUrl);
    return fallbackUrl;
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
