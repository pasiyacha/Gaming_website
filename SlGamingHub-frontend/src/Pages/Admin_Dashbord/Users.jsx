import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_CONFIG } from "../../config/apiConfig";
import { getApiUrl, getApiHeaders } from "../../utils/apiUtils";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [editingUser, setEditingUser] = useState(null); // track user being edited
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", role: "" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingUser, setSavingUser] = useState(false); // Add state for save operation
  const [isAddingUser, setIsAddingUser] = useState(false); // Add state for adding new user
  const [newUserData, setNewUserData] = useState({ name: "", email: "", phone: "", password: "", role: "user" }); // New user data

  // Function to normalize role names
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

  // Initialize component
  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    // Try to fetch from real API
    try {
      const token = localStorage.getItem("token"); 
      
      if (!token) {
        setError("Authentication token not found. Please login again.");
        setLoading(false);
        return;
      }

      console.log("Fetching users with token:", token);
      
      let apiSuccess = false;
      let fetchedUsers = [];
      
      // Try primary endpoint first
      try {
        const res = await axios.get(getApiUrl("/api/users"), {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Primary API response:", res.data);
        
        // Make sure res.data is an array
        if (Array.isArray(res.data)) {
          fetchedUsers = res.data;
          apiSuccess = true;
        } else if (res.data && Array.isArray(res.data.users)) {
          fetchedUsers = res.data.users;
          apiSuccess = true;
        } else if (res.data && typeof res.data === 'object') {
          fetchedUsers = [res.data];
          apiSuccess = true;
        }
      } catch (err) {
        console.error("Primary endpoint failed, trying alternative endpoint", err);
        
        // Try alternative endpoints
        try {
          const res = await axios.get(getApiUrl("/api/user-management/users"), {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("Alternative API response:", res.data);
          
          if (Array.isArray(res.data)) {
            fetchedUsers = res.data;
            apiSuccess = true;
          } else if (res.data && Array.isArray(res.data.users)) {
            fetchedUsers = res.data.users;
            apiSuccess = true;
          } else if (res.data && typeof res.data === 'object') {
            fetchedUsers = [res.data];
            apiSuccess = true;
          }
        } catch (altErr) {
          console.error("Alternative endpoint also failed", altErr);
          
          // One more attempt with a different endpoint
          try {
            const res = await axios.get(getApiUrl("/api/user/all"), {
              headers: { Authorization: `Bearer ${token}` },
            });
            console.log("Third API response:", res.data);
            
            if (Array.isArray(res.data)) {
              fetchedUsers = res.data;
              apiSuccess = true;
            } else if (res.data && Array.isArray(res.data.users)) {
              fetchedUsers = res.data.users;
              apiSuccess = true;
            } else if (res.data && typeof res.data === 'object') {
              fetchedUsers = [res.data];
              apiSuccess = true;
            }
          } catch (thirdErr) {
            console.error("Third endpoint also failed", thirdErr);
            // Continue to localStorage fallback
          }
        }
      }
      
      // Fallback to localStorage if API calls fail
      if (!apiSuccess) {
        console.log("All API endpoints failed, falling back to localStorage");
        
        // Get users from localStorage
        const localUsers = JSON.parse(localStorage.getItem("users") || "[]");
        console.log("Users from localStorage:", localUsers);
        
        fetchedUsers = localUsers;
        
        // If there are no users in localStorage, create a default admin
        if (fetchedUsers.length === 0) {
          const defaultAdmin = {
            _id: "admin_default",
            name: "Admin User",
            email: "admin@example.com",
            phone: "1234567890",
            role: "admin",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          
          fetchedUsers = [defaultAdmin];
          
          // Save to localStorage
          localStorage.setItem("users", JSON.stringify(fetchedUsers));
          console.log("Created default admin in localStorage");
        }
      }
      
      // Normalize roles for consistent display
      fetchedUsers.forEach(user => {
        console.log(`User ${user._id}: role = ${user.role}, normalized = ${normalizeRole(user.role)}`);
      });
      
      setUsers(fetchedUsers);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users. " + (error.response?.data?.message || error.message));
      
      // Fallback to localStorage even in case of unexpected errors
      try {
        const localUsers = JSON.parse(localStorage.getItem("users") || "[]");
        console.log("Error recovery: Using users from localStorage:", localUsers);
        setUsers(localUsers);
      } catch (localStorageError) {
        console.error("Error reading from localStorage:", localStorageError);
        setUsers([]); // Initialize as empty array
      }
      
      setLoading(false);
    }
  };

  // Toggle active/inactive
  const toggleUserStatus = async (id, currentStatus) => {
    if (!id) {
      setError("Cannot update user without an ID");
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found. Please login again.");
        return;
      }

      let apiSuccess = false;
      
      try {
        // First attempt the standard status endpoint
        try {
          console.log(`Toggling user status to: ${!currentStatus}`);
          await axios.patch(
            getApiUrl(`/api/users/status/${id}`),
            { isActive: !currentStatus },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          apiSuccess = true;
        } catch (statusError) {
          console.error("Status endpoint failed, trying alternative endpoint:", statusError);
          
          // Try an alternative endpoint pattern
          try {
            await axios.patch(
              getApiUrl(`/api/users/${id}/status`),
              { isActive: !currentStatus },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            apiSuccess = true;
          } catch (altEndpointError) {
            console.error("Alternative endpoint failed, trying standard update with active field:", altEndpointError);
            
            // As a last resort, try updating the user with both field names
            try {
              await axios.patch(
                getApiUrl(`/api/users/${id}`),
                { 
                  isActive: !currentStatus,
                  active: !currentStatus,
                  status: !currentStatus ? "active" : "inactive"
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              apiSuccess = true;
            } catch (finalError) {
              console.error("All API endpoints failed:", finalError);
              // Proceed to localStorage fallback
            }
          }
        }
      } catch (error) {
        console.error("API failed:", error);
        // Proceed to localStorage fallback
      }
      
      // Fallback to localStorage if API calls fail
      if (!apiSuccess) {
        console.log("API calls failed, using localStorage for status toggle");
        
        // Get users from localStorage
        const localUsers = JSON.parse(localStorage.getItem("users") || "[]");
        
        // Find the user and update status
        const updatedUsers = localUsers.map(user => {
          if (user._id === id) {
            return {
              ...user,
              isActive: !currentStatus,
              active: !currentStatus,
              updatedAt: new Date().toISOString()
            };
          }
          return user;
        });
        
        // Save back to localStorage
        localStorage.setItem("users", JSON.stringify(updatedUsers));
        console.log("User status updated in localStorage");
      }
      
      // Refresh the user list
      fetchUsers();
    } catch (error) {
      console.error("Error updating user status:", error);
      setError("Failed to update user status. " + (error.response?.data?.message || error.message));
    }
  };

  // Delete user
  const deleteUser = async (id) => {
    if (!id) {
      setError("Cannot delete user without an ID");
      return;
    }
    
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    try {
      setLoading(true); // Show loading indicator
      
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found. Please login again.");
        setLoading(false);
        return;
      }

      console.log(`Attempting to delete user with ID: ${id}`);
      
      let apiSuccess = false;
      
      try {
        // First try the main endpoint
        await axios.delete(getApiUrl(`/api/users/${id}`), {
          headers: { Authorization: `Bearer ${token}` },
        });
        console.log("User deleted successfully");
        apiSuccess = true;
      } catch (mainError) {
        console.error("Primary delete endpoint failed:", mainError);
        
        // If main endpoint fails, try alternative endpoint
        try {
          await axios.delete(getApiUrl(`/api/user/${id}`), {
            headers: { Authorization: `Bearer ${token}` },
          });
          console.log("User deleted successfully via alternative endpoint");
          apiSuccess = true;
        } catch (altError) {
          console.error("Alternative delete endpoint failed:", altError);
          // Proceed to localStorage fallback
        }
      }
      
      // Fallback to localStorage if API calls fail
      if (!apiSuccess) {
        console.log("API calls failed, using localStorage for user deletion");
        
        // Get users from localStorage
        const localUsers = JSON.parse(localStorage.getItem("users") || "[]");
        
        // Filter out the user to be deleted
        const updatedUsers = localUsers.filter(user => user._id !== id);
        
        // Save back to localStorage
        localStorage.setItem("users", JSON.stringify(updatedUsers));
        console.log("User deleted from localStorage");
      }
      
      // Show success message
      alert("User deleted successfully");
      
      // Refresh the user list
      fetchUsers();
    } catch (error) {
      console.error("Error deleting user:", error);
      
      // Enhanced error logging
      if (error.response) {
        console.error("API response status:", error.response.status);
        console.error("API response data:", error.response.data);
        setError("Failed to delete user: " + (error.response.data?.message || error.message));
      } else if (error.request) {
        console.error("No response received:", error.request);
        setError("Failed to delete user: No response from server. Check your network connection.");
      } else {
        console.error("Error details:", error);
        setError("Failed to delete user: " + (error.message || "Unknown error"));
      }
      
      setLoading(false);
    }
  };

  // Start editing user
  const startEdit = (user) => {
    if (!user || !user._id) {
      setError("Cannot edit user without proper data");
      return;
    }
    
    console.log("Starting edit for user:", user);
    
    // Make sure to capture the current role correctly
    const currentRole = normalizeRole(user.role);
    console.log("Current user role:", currentRole, "Original value:", user.role);
    
    setEditingUser(user._id);
    setFormData({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: currentRole,
    });
    
    console.log("Form data initialized:", {
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      role: currentRole,
    });
  };

  // Save user edits
  const saveUser = async (id) => {
    if (!id) {
      setError("Cannot save user without an ID");
      return;
    }
    
    setSavingUser(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found. Please login again.");
        setSavingUser(false);
        return;
      }

      console.log("Saving user with ID:", id);
      console.log("Form data being sent:", formData);
      
      // Create a properly structured payload for the API
      const dataToSend = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        role: formData.role
      };
      
      console.log("Final data being sent:", dataToSend);

      // Try different API endpoints until one works
      let apiSuccess = false;
      let response = null;
      
      try {
        // First attempt: Standard PUT endpoint
        response = await axios.put(
          getApiUrl(`/api/users/${id}`),
          dataToSend,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        apiSuccess = true;
        console.log("Update successful via PUT /api/users/:id", response.data);
      } catch (putError) {
        console.error("PUT request failed, trying PATCH", putError);
        
        try {
          // Second attempt: PATCH endpoint
          response = await axios.patch(
            getApiUrl(`/api/users/${id}`),
            dataToSend,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          apiSuccess = true;
          console.log("Update successful via PATCH /api/users/:id", response.data);
        } catch (patchError) {
          console.error("PATCH request also failed, trying alternative endpoint", patchError);
          
          try {
            // Third attempt: Alternative endpoint structure
            response = await axios.put(
              getApiUrl(`/api/user/${id}`),
              dataToSend,
              { headers: { Authorization: `Bearer ${token}` } }
            );
            apiSuccess = true;
            console.log("Update successful via PUT /api/user/:id", response.data);
          } catch (alternativeError) {
            console.error("All update attempts failed", alternativeError);
            // Proceed to localStorage fallback
          }
        }
      }
      
      // Fallback to localStorage if API calls fail
      if (!apiSuccess) {
        console.log("API calls failed, using localStorage for user update");
        
        // Get users from localStorage
        const localUsers = JSON.parse(localStorage.getItem("users") || "[]");
        
        // Find and update the user
        const updatedUsers = localUsers.map(user => {
          if (user._id === id) {
            return {
              ...user,
              name: formData.name,
              email: formData.email,
              phone: formData.phone,
              role: formData.role,
              updatedAt: new Date().toISOString()
            };
          }
          return user;
        });
        
        // Save back to localStorage
        localStorage.setItem("users", JSON.stringify(updatedUsers));
        console.log("User updated in localStorage");
      }
      
      // Show success message
      alert("User updated successfully");
      
      // Reset the edit state
      setEditingUser(null);
      
      // Refresh the user list
      fetchUsers();
    } catch (error) {
      console.error("Error editing user:", error);
      
      // More detailed error logging
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        setError("Failed to save user: " + (error.response.data?.message || error.message));
      } else if (error.request) {
        console.error("No response received:", error.request);
        setError("Failed to save user: No response from server. Check your network connection.");
      } else {
        console.error("Error details:", error);
        setError("Failed to save user: " + (error.message || "Unknown error"));
      }
    } finally {
      setSavingUser(false);
    }
  };

  // Add new user or admin
  const addNewUser = async () => {
    // Validate input fields
    if (!newUserData.name || !newUserData.email || !newUserData.password) {
      setError("Name, email, and password are required");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUserData.email)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Authentication token not found. Please login again.");
        setLoading(false);
        return;
      }
      
      console.log("Creating new user:", newUserData);
      
      // Try API first, then fallback to localStorage
      let apiSuccess = false;
      
      try {
        // First attempt: Standard users endpoint
        const response = await axios.post(
          getApiUrl("/api/users"),
          newUserData,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        console.log("User created successfully:", response.data);
        apiSuccess = true;
      } catch (mainError) {
        console.error("Primary create endpoint failed:", mainError);
        
        // Second attempt: Auth register endpoint
        try {
          const response = await axios.post(
            getApiUrl("/api/auth/register"),
            { ...newUserData, isAdmin: newUserData.role === "admin" },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          console.log("User created successfully via alternative endpoint:", response.data);
          apiSuccess = true;
        } catch (altError) {
          console.error("Alternative create endpoint failed:", altError);
          // Continue to localStorage fallback
        }
      }
      
      // If API calls fail, use localStorage as fallback
      if (!apiSuccess) {
        console.log("API calls failed, using localStorage fallback");
        
        // Get existing users from localStorage or initialize empty array
        const existingUsers = JSON.parse(localStorage.getItem("users") || "[]");
        
        // Create new user object with ID and timestamps
        const newUser = {
          _id: "user_" + Date.now(),
          name: newUserData.name,
          email: newUserData.email,
          phone: newUserData.phone || "",
          password: newUserData.password, // In a real app, this should be hashed
          role: newUserData.role,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        // Add to users array
        existingUsers.push(newUser);
        
        // Save back to localStorage
        localStorage.setItem("users", JSON.stringify(existingUsers));
        
        console.log("User saved to localStorage:", newUser);
      }
      
      // Show success message
      alert(`${newUserData.role === "admin" ? "Admin" : "User"} created successfully!`);
      
      // Reset form and close it
      setNewUserData({ name: "", email: "", phone: "", password: "", role: "user" });
      setIsAddingUser(false);
      
      // Refresh the user list
      fetchUsers();
      
    } catch (error) {
      console.error("Error creating user:", error);
      
      // Detailed error logging
      if (error.response) {
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        setError("Failed to create user: " + (error.response.data?.message || error.message));
      } else if (error.request) {
        console.error("No response received:", error.request);
        setError("Failed to create user: No response from server. Check your network connection.");
      } else {
        console.error("Error details:", error);
        setError("Failed to create user: " + (error.message || "Unknown error"));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-2 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Users</h2>
        <div className="space-x-2">
          <button 
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
            onClick={() => {
              setIsAddingUser(true);
              setNewUserData({ name: "", email: "", phone: "", password: "", role: "admin" });
            }}
          >
            Add Admin
          </button>
          <button 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md"
            onClick={() => {
              setIsAddingUser(true);
              setNewUserData({ name: "", email: "", phone: "", password: "", role: "user" });
            }}
          >
            Add User
          </button>
        </div>
      </div>
      
      {/* Add User Form */}
      {isAddingUser && (
        <div className="bg-gray-100 p-4 mb-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">
              {newUserData.role === "admin" ? "Add New Admin" : "Add New User"}
            </h3>
            <button 
              className="text-gray-600 hover:text-gray-800"
              onClick={() => setIsAddingUser(false)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={newUserData.name}
                onChange={(e) => setNewUserData({ ...newUserData, name: e.target.value })}
                className="border p-2 w-full rounded"
                placeholder="Full Name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={newUserData.email}
                onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
                className="border p-2 w-full rounded"
                placeholder="Email Address"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="text"
                value={newUserData.phone}
                onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
                className="border p-2 w-full rounded"
                placeholder="Phone Number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={newUserData.password}
                onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
                className="border p-2 w-full rounded"
                placeholder="Password"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <select
                value={newUserData.role}
                onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
                className="border p-2 w-full rounded"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
              onClick={addNewUser}
            >
              Create {newUserData.role === "admin" ? "Admin" : "User"}
            </button>
          </div>
        </div>
      )}
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p>{error}</p>
          <button 
            className="mt-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            onClick={fetchUsers}
          >
            Try Again
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        /* Responsive Users Table */
        <div className="overflow-x-auto">
          {!Array.isArray(users) || users.length === 0 ? (
            <p className="text-center py-4">No users found</p>
          ) : (
            <table className="w-full border text-xs sm:text-base">
              <thead>
                <tr className="bg-[#0e08ab] text-white">
                  <th className="p-2 border">ID</th>
                  <th className="p-2 border">Name</th>
                  <th className="p-2 border">Email</th>
                  <th className="p-2 border">Phone</th>
                  <th className="p-2 border">Role</th>
                  <th className="p-2 border">Status</th>
                  <th className="p-2 border">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u, index) => (
                  <tr key={u._id || `user-${index}`} className="bg-white even:bg-gray-100">
                    <td className="p-2 border break-all">{u._id || 'N/A'}</td>

                {/* If editing this user → show input fields */}
                {editingUser === u._id ? (
                  <>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="border p-1 w-full"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="border p-1 w-full"
                      />
                    </td>
                    <td className="p-2 border">
                      <input
                        type="text"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="border p-1 w-full"
                      />
                    </td>
                    <td className="p-2 border">
                      <select
                        value={formData.role}
                        onChange={(e) => {
                          console.log("Role changed to:", e.target.value);
                          setFormData({ ...formData, role: e.target.value });
                        }}
                        className="border p-1 w-full"
                      >
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="p-2 border break-all">{u.name || 'N/A'}</td>
                    <td className="p-2 border break-all">{u.email || 'N/A'}</td>
                    <td className="p-2 border break-all">{u.phone || 'N/A'}</td>
                    <td className="p-2 border">
                      {normalizeRole(u.role) === 'admin' ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full">
                          Admin
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                          User
                        </span>
                      )}
                    </td>
                  </>
                )}

                <td className="p-2 border">{(u.isActive || u.active) ? "Active" : "Inactive"}</td>
                <td className="p-2 border flex gap-2 flex-wrap">
                  <button
                    onClick={() => toggleUserStatus(u._id, (u.isActive || u.active))}
                    className={`px-2 py-1 rounded text-white ${
                      (u.isActive || u.active) ? "bg-red-500 hover:bg-red-600" : "bg-green-500 hover:bg-green-600"
                    }`}
                  >
                    {(u.isActive || u.active) ? "Deactivate" : "Activate"}
                  </button>

                  {editingUser === u._id ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveUser(u._id)}
                        className="px-2 py-1 rounded bg-blue-500 hover:bg-blue-600 text-white flex items-center"
                        disabled={savingUser}
                      >
                        {savingUser ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </button>
                      <button
                        onClick={() => setEditingUser(null)}
                        className="px-2 py-1 rounded bg-gray-500 hover:bg-gray-600 text-white"
                        disabled={savingUser}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEdit(u)}
                      className="px-2 py-1 rounded bg-yellow-500 hover:bg-yellow-600 text-white"
                    >
                      Edit
                    </button>
                  )}

                  <button
                    onClick={() => deleteUser(u._id)}
                    className="px-2 py-1 rounded bg-gray-700 hover:bg-gray-800 text-white"
                  >
                    Delete
                  </button>
                </td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>
      )}
    </div>
  );
};

export default Users;
