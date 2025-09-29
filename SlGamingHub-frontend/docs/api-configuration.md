# API Configuration Guide

## Overview

This document explains how the API configuration works in the SL Gaming Hub frontend application. We've implemented a centralized API configuration system to make it easier to manage API endpoints and switch between development and production environments.

## Key Files

1. **`src/config/apiConfig.js`**: Contains the central API configuration including base URLs for development and production.
2. **`src/utils/apiUtils.js`**: Provides utility functions for working with API endpoints.

## How It Works

The system automatically selects the appropriate base URL depending on the environment:

- In development mode: `http://localhost:5000/api`
- In production mode: `http://16.170.236.106:5000/api`

## Using the API Utilities

When making API calls, use the utility functions instead of hardcoded URLs:

```javascript
import { getApiUrl, getApiHeaders } from '../utils/apiUtils';

// Example GET request
const fetchData = async () => {
  const response = await axios.get(getApiUrl('/users'), {
    headers: getApiHeaders()
  });
  return response.data;
};

// Example POST request
const createItem = async (data) => {
  const response = await axios.post(getApiUrl('/items'), data, {
    headers: getApiHeaders()
  });
  return response.data;
};
```

## API Headers

The `getApiHeaders()` function automatically includes:

1. Content-Type header (application/json)
2. Authorization header with the JWT token (if available in localStorage)

## Customizing the Configuration

To change the API URLs or add new endpoints, edit the `apiConfig.js` file:

```javascript
// Example of adding a new endpoint
export const API_CONFIG = {
  // existing config...
  
  ENDPOINTS: {
    BANKS: '/banks',
    USERS: '/users',
    // Add your new endpoint here
    NOTIFICATIONS: '/notifications',
  },
};
```

## Environment Variables

You can also use environment variables to override the API configuration by creating a `.env` file:

```
REACT_APP_API_URL=http://16.170.236.106:5000/api
```

## Troubleshooting

If you encounter API connection issues:

1. Check that you're using the `getApiUrl()` function for all API calls
2. Verify that the backend server is running at the expected URL
3. Check the browser console for any CORS errors
