import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { decodeToken, login } from "../../utils/authUtils";
import { getApiUrl, getApiHeaders } from "../../utils/apiUtils";
import { API_CONFIG } from "../../config/apiConfig";

export default function LoginForm({ onClose, onShowRegister, onShowReset }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the "from" location if it exists, otherwise default to home
  const from = location.state?.from || "/";
  
  // Safe close function that checks if onClose is provided
  const safeClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please fill in both fields");
      return;
    }

    try {
      setLoading(true);
      setError("");
      
      const loginData = {
        email,
        password,
      };
      
      console.log("Attempting login with:", loginData);

      // Check if the API endpoint is correct - try with different endpoint structures
      let res;
      try {
        res = await axios.post(getApiUrl("/api/users/auth/login"), loginData);
      } catch (loginError) {
        console.error("First login attempt failed:", loginError);
        
        // Try alternate endpoint format
        try {
          res = await axios.post(getApiUrl("/api/auth/login"), loginData);
        } catch (altLoginError) {
          console.error("Second login attempt failed:", altLoginError);
          throw loginError; // Throw the original error if both fail
        }
      }

      console.log("Login response:", res.data);
      
      if (!res.data.token) {
        throw new Error("No token received from server");
      }
      
      console.log("Token received:", res.data.token.substring(0, 20) + "...");
      
      // Try to get user role and name from different possible sources
      let isAdmin = false;
      let userRole = "user"; // Default role
      let userName = ""; // Store user's name
      let userData = {};
      
      // 1. Check if user object is in the response
      if (res.data.user) {
        // Extract role
        if (res.data.user.role) {
          userRole = res.data.user.role;
          isAdmin = userRole === "admin";
          userData.role = userRole;
        }
        
        // Extract name (checking different possible field names)
        userName = res.data.user.name || 
                  res.data.user.firstName || 
                  res.data.user.fullName || 
                  res.data.user.username || 
                  "";
        if (userName) {
          userData.name = userName;
        }
      } 
      // 2. Check if role is directly in the response
      else if (res.data.role) {
        userRole = res.data.role;
        isAdmin = userRole === "admin";
        userData.role = userRole;
        
        // Check for name in the direct response
        userName = res.data.name || 
                  res.data.firstName || 
                  res.data.fullName || 
                  res.data.username || 
                  "";
        if (userName) {
          userData.name = userName;
        }
      } 
      // 3. Try to extract role from the JWT token
      else {
        try {
          const decodedToken = decodeToken(res.data.token);
          console.log("Decoded token:", decodedToken);
          
          if (decodedToken) {
            // Extract role from token
            if (decodedToken.role) {
              userRole = decodedToken.role;
              isAdmin = userRole === "admin";
              userData.role = userRole;
            }
            
            // Extract name from token
            userName = decodedToken.name || 
                      decodedToken.firstName || 
                      decodedToken.fullName || 
                      decodedToken.username || 
                      "";
            if (userName) {
              userData.name = userName;
            }
          }
        } catch (decodeError) {
          console.error("Error decoding token:", decodeError);
          // Continue with default user role
        }
      }
      
      // Use the login utility to store token and user data and trigger auth event
      login(res.data.token, userData);
      
      // Check if user is admin and redirect accordingly
      if (isAdmin) {
        alert("Admin login successful!");
        safeClose();
        
        // Navigate first, then reload (with a slight delay to ensure navigation completes)
        navigate("/admin/Order");
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        alert("Login successful!");
        safeClose();
        
        // Navigate to the "from" location or default home
        navigate(from);
        setTimeout(() => {
          window.location.reload();
        }, 100);
      }
    } catch (err) {
      console.error("Login error:", err);
      
      // Detailed error logging
      if (err.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
        console.error("Response headers:", err.response.headers);
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        // The request was made but no response was received
        console.error("No response received:", err.request);
        setError("No response from server. Please check your connection.");
      } else {
        // Something happened in setting up the request that triggered an Error
        console.error("Error setting up request:", err.message);
        setError(`Login failed: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const isPopup = typeof onClose === 'function';

  return (
    <div className="max-w-md w-full mx-auto bg-gray-900 bg-opacity-90 text-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-300">Welcome to</h2>
        <h1 className="text-2xl font-bold text-orange-400">SL Gaming Hub</h1>
      </div>

      {/* Login Form Section */}
      <div className="space-y-4">
        {/* Email Input */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Phone Number or Email <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            placeholder="Phone number or Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <span
              className="absolute right-3 top-2.5 cursor-pointer text-gray-400 hover:text-white"
              onClick={() => setShowPassword(!showPassword)}
            >
              👁
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Action Buttons */}
        <div className={isPopup ? "flex justify-between gap-3" : ""}>
          <button
            className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold disabled:opacity-50"
            onClick={handleLogin}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
          
          {isPopup && (
            <button
              className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold"
              onClick={safeClose}
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Sample Credentials */}
      <div className="bg-gray-800 p-4 rounded-lg border border-gray-700 my-4">
        <h3 className="text-center text-yellow-400 font-medium mb-2">Test Accounts</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-700 p-3 rounded">
            <h4 className="text-green-400 font-medium mb-1">Regular User</h4>
            <p className="text-sm text-gray-300">Email: <span className="text-white">user@mail.com</span></p>
            <p className="text-sm text-gray-300">Password: <span className="text-white">user@123</span></p>
          </div>
          <div className="bg-gray-700 p-3 rounded">
            <h4 className="text-blue-400 font-medium mb-1">Admin User</h4>
            <p className="text-sm text-gray-300">Email: <span className="text-white">admin@mail.com</span></p>
            <p className="text-sm text-gray-300">Password: <span className="text-white">admin@123</span></p>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="text-center space-y-2 mt-4">
        <Link to="/auth/reset" className="text-blue-400 hover:underline text-sm block">
          Forgot password?
        </Link>
        <div className="text-gray-400 text-sm">
          Don't have an account?{" "}
          <Link to="/auth/register" className="text-blue-400 hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
