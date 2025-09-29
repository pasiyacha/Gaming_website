// Function to specifically update user role
import axios from 'axios';
import { getApiUrl, getApiHeaders } from './apiUtils';

// Helper function to normalize role names
const normalizeRole = (role) => {
  if (!role) return "user";
  
  // Convert to lowercase for case-insensitive comparison
  const lowerRole = typeof role === 'string' ? role.toLowerCase() : String(role).toLowerCase();
  
  // Check for admin variations
  if (lowerRole === "admin" || lowerRole === "administrator") {
    return "admin";
  }
  
  // Check for customer/user variations
  if (lowerRole === "customer" || lowerRole === "user" || lowerRole === "client") {
    return "user";
  }
  
  // Default fallback
  return "user";
};

export const updateUserRole = async (userId, newRole, token) => {
  // Normalize the role to ensure consistency
  const normalizedRole = normalizeRole(newRole);
  
  // Log the attempt
  console.log(`Attempting to update user ${userId} to role: ${normalizedRole} (original input: ${newRole})`);
  
  if (!userId || !newRole || !token) {
    console.error("Missing required parameters for role update");
    throw new Error("Missing required parameters");
  }

  // Enhanced error reporting to track which endpoints are attempted
  const attempts = [];
  
  try {
    // Attempt 1: Standard PUT with role-only payload
    try {
      console.log("Attempt 1: Standard PUT with role-only payload", { url: getApiUrl(`/api/users/${userId}`) });
      const response = await axios.put(
        getApiUrl(`/api/users/${userId}`),
        { role: normalizedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Attempt 1 SUCCESS", response.data);
      return response.data;
    } catch (error) {
      attempts.push({ endpoint: "PUT /api/users/:id", error: error.message });
      console.log("Attempt 1 FAILED", error.message);
    }
    
    // Attempt 2: Dedicated role endpoint
    try {
      console.log("Attempt 2: Dedicated role endpoint", { url: getApiUrl(`/api/users/role/${userId}`) });
      const response = await axios.put(
        getApiUrl(`/api/users/role/${userId}`),
        { role: normalizedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Attempt 2 SUCCESS", response.data);
      return response.data;
    } catch (error) {
      attempts.push({ endpoint: "PUT /api/users/role/:id", error: error.message });
      console.log("Attempt 2 FAILED", error.message);
    }
    
    // Attempt 3: PATCH method instead of PUT
    try {
      console.log("Attempt 3: PATCH method", { url: getApiUrl(`/api/users/${userId}`) });
      const response = await axios.patch(
        getApiUrl(`/api/users/${userId}`),
        { role: normalizedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Attempt 3 SUCCESS", response.data);
      return response.data;
    } catch (error) {
      attempts.push({ endpoint: "PATCH /api/users/:id", error: error.message });
      console.log("Attempt 3 FAILED", error.message);
    }
    
    // Attempt 4: Alternative URL structure
    try {
      console.log("Attempt 4: Alternative URL", { url: getApiUrl(`/api/users/${userId}/role`) });
      const response = await axios.put(
        getApiUrl(`/api/users/${userId}/role`),
        { role: normalizedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log("Attempt 4 SUCCESS", response.data);
      return response.data;
    } catch (error) {
      attempts.push({ endpoint: "PUT /api/users/:id/role", error: error.message });
      console.log("Attempt 4 FAILED", error.message);
    }
    
    // Attempt 5: Full user update
    try {
      // Fetch the current user first
      console.log("Attempt 5: Full user update - fetching user first", { userId });
      const userResponse = await axios.get(
        getApiUrl(`/api/users/${userId}`),
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const userData = userResponse.data;
      
      // Update with all fields and the new role
      console.log("Attempt 5: Sending full user data with updated role", { 
        url: getApiUrl(`/api/users/${userId}`),
        userData: { ...userData, role: normalizedRole }
      });
      
      const response = await axios.put(
        getApiUrl(`/api/users/${userId}`),
        { ...userData, role: normalizedRole },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log("Attempt 5 SUCCESS", response.data);
      return response.data;
    } catch (error) {
      attempts.push({ endpoint: "Full user update", error: error.message });
      console.log("Attempt 5 FAILED", error.message);
    }
    
    // If we reach here, all attempts failed
    console.error("All role update attempts failed:", attempts);
    throw new Error("All role update attempts failed. Check console for details.");
    
  } catch (error) {
    console.error("Role update error:", error.message);
    throw error;
  }
};
