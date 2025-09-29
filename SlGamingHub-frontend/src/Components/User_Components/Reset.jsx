import React, { useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";
import { getApiUrl, getApiHeaders } from "../../utils/apiUtils";

export default function ResetPassword({ onClose, onShowLogin, onShowRegister }) {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!emailOrPhone) {
      alert("Please enter your email or phone number.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(getApiUrl("/api/auth/send-otp"), {
        emailOrPhone: emailOrPhone,
      });

      if (response.data.success) {
        alert("OTP sent successfully!");
        console.log("Response:", response.data);
      } else {
        alert(response.data.message || "Something went wrong.");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Overlay background
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      {/* Popup modal */}
      <div className="w-full max-w-sm bg-gradient-to-b from-purple-900 to-purple-950 text-white rounded-2xl shadow-2xl p-6 relative">
        
        {/* Close button (top-right) */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white hover:text-red-400 text-xl"
        >
          ✕
        </button>

        {/* Title */}
        <h2 className="text-2xl font-bold text-center mb-2">Reset Password</h2>
        <p className="text-center text-gray-300 text-sm mb-4">
          Enter your email or phone to receive an OTP.
        </p>

        {/* Nav Buttons */}
        <div className="flex justify-center gap-2 mb-6">
          <Link to={"/auth/Login"}>
            <button
              onClick={onShowLogin}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold text-sm"
            >
              Login
            </button>
          </Link>

          <Link to={"/auth/Register"}>
            <button
              onClick={onShowRegister}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold text-sm"
            >
              Register
            </button>
          </Link>
        </div>

        {/* Input */}
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Email or Phone Number <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={emailOrPhone}
          onChange={(e) => setEmailOrPhone(e.target.value)}
          placeholder="Enter your email or phone"
          className="w-full p-3 rounded-lg mb-4 text-black"
        />

        {/* Send OTP */}
        <button
          onClick={handleSendOtp}
          disabled={loading}
          className={`w-full py-3 rounded-lg text-white font-bold ${
            loading
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-gradient-to-r from-pink-500 to-purple-500"
          }`}
        >
          {loading ? "Sending..." : "Send OTP"}
        </button>

        {/* Back to Login */}
        <p
          onClick={onShowLogin}
          className="text-center text-sm mt-3 text-gray-300 cursor-pointer hover:underline"
        >
          Back to Login
        </p>

      </div>
    </div>
  );
}
