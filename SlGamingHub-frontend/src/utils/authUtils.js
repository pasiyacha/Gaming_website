// Function to decode JWT token
export const decodeToken = (token) => {
  try {
    // First, verify the token is a proper format
    if (!token || typeof token !== 'string' || !token.includes('.')) {
      console.error('Invalid token format:', token);
      return null;
    }

    // JWT tokens consist of three parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Token does not have three parts:', token);
      return null;
    }

    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    
    // Use a more robust approach for base64 decoding
    let jsonPayload;
    try {
      // Using built-in atob function for base64 decoding
      const decodedData = atob(base64);
      // Convert binary to string
      jsonPayload = decodeURIComponent(
        Array.from(decodedData)
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
    } catch (decodeError) {
      console.error('Base64 decoding failed:', decodeError);
      // Alternative base64 decoding approach
      const rawData = window.atob(base64);
      const outputArray = new Uint8Array(rawData.length);
      for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
      }
      jsonPayload = new TextDecoder().decode(outputArray);
    }

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Error decoding token:', error);
    return null;
  }
};

// Login helper function
export const login = (token, userData = {}) => {
  localStorage.setItem('token', token);
  
  if (userData.role) {
    localStorage.setItem('userRole', userData.role);
  }
  
  if (userData.name) {
    localStorage.setItem('userName', userData.name);
  }
  
  // Dispatch a custom event for login
  window.dispatchEvent(new CustomEvent('authChange', { detail: { isLoggedIn: true } }));
};

// Logout helper function
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userName');
  localStorage.removeItem('userRole');
  
  // Dispatch a custom event for logout
  window.dispatchEvent(new CustomEvent('authChange', { detail: { isLoggedIn: false } }));
};

// Check if user is logged in
export const isLoggedIn = () => {
  return !!localStorage.getItem('token');
};

// Get user role
export const getUserRole = () => {
  return localStorage.getItem('userRole') || 'user';
};

// Get user name
export const getUserName = () => {
  return localStorage.getItem('userName') || '';
};

// Check if user is admin
export const isAdmin = () => {
  return getUserRole() === 'admin';
};

// Get user ID from the token
export const getUserId = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    
    const decoded = decodeToken(token);
    if (!decoded) return null;
    
    // The JWT usually stores the user ID in id, _id, userId or sub field
    return decoded.id || decoded._id || decoded.userId || decoded.sub || null;
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};
