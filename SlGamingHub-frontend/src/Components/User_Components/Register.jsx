import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import OTP from "./OTP";
import { getApiUrl, getApiHeaders } from "../../utils/apiUtils";

export default function Register({ onClose, onShowLogin, onShowReset }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "customer",
  });

  // Safe close function that checks if onClose is provided
  const safeClose = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(""); // Clear error when user types
  };

  async function handleRegister(e) {
    e.preventDefault();

    if (
      !formData.firstName ||
      !formData.lastName ||
      !formData.email ||
      !formData.phone ||
      !formData.password ||
      !formData.confirmPassword
    ) {
      setError("Please fill all required fields!");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setLoading(true);
    setError("");

    try {
      console.log("Attempting registration with:", {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
      });
      
      const res = await axios.post(getApiUrl("/api/users/auth/register"), {
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        phone: formData.phone,
        role: formData.role,
      });

      if (res.data) {
        console.log("Registration response:", res.data);
        alert("Registration successful! Please check your email for OTP.");
        setUserId(res.data.tempUserId); // Backend eken userId ena eka yawanna one
        setShowOtpModal(true);

        setFormData({
          firstName: "",
          lastName: "",
          phone: "",
          email: "",
          password: "",
          confirmPassword: "",
          role: "customer",
        });
      }
    } catch (err) {
      console.error("Registration error:", err);
      
      // Detailed error logging
      if (err.response) {
        console.error("Response data:", err.response.data);
        console.error("Response status:", err.response.status);
        setError(err.response.data?.message || err.response.data?.error || `Server error: ${err.response.status}`);
      } else if (err.request) {
        console.error("No response received:", err.request);
        setError("No response from server. Please check your connection.");
      } else {
        console.error("Error setting up request:", err.message);
        setError(`Registration failed: ${err.message}`);
      }
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md w-full mx-auto bg-gray-900 bg-opacity-90 text-white rounded-xl shadow-lg p-6 space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="text-lg font-medium text-gray-300">Welcome to</h2>
        <h1 className="text-2xl font-bold text-orange-400">SL Gaming Hub</h1>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        {/* Navigation Buttons - Only show if in popup mode */}
        {typeof onShowLogin === 'function' && (
          <div className="flex justify-center gap-3 mb-4">
            <button
              type="button"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold"
              onClick={onShowLogin}
            >
              Login
            </button>
            {typeof onShowReset === 'function' && (
              <button
                type="button"
                className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold"
                onClick={onShowReset}
              >
                Reset
              </button>
            )}
          </div>
        )}

        {/* Form Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              First Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              placeholder="First name"
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Last Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              placeholder="Last name"
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email address"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Phone <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone number"
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create password"
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <span
              className="absolute right-3 top-2.5 cursor-pointer text-gray-400 hover:text-white"
              onClick={() => setShowPassword(!showPassword)}
            >
              👁
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Confirm Password <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600 text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
            />
            <span
              className="absolute right-3 top-2.5 cursor-pointer text-gray-400 hover:text-white"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              👁
            </span>
          </div>
        </div>

        {/* Error Message */}
        {error && <p className="text-red-400 text-sm">{error}</p>}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <button
            type="submit"
            className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg font-semibold disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </button>
          {typeof onClose === 'function' && (
            <button
              type="button"
              className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold"
              onClick={safeClose}
              disabled={loading}
            >
              Close
            </button>
          )}
        </div>
      </form>

      {/* Links */}
      <div className="text-center space-y-2 mt-4">
        <div className="text-gray-400 text-sm">
          Already have an account?{" "}
          <Link to="/auth/login" className="text-blue-400 hover:underline">
            Login
          </Link>
        </div>
      </div>

      {/* OTP Modal */}
      {showOtpModal && (
        <OTP userId={userId} onClose={() => setShowOtpModal(false)} />
      )}
    </div>
  );
}
