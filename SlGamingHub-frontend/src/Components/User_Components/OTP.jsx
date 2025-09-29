import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getApiUrl, getApiHeaders } from "../../utils/apiUtils";

export default function OTP({ userId, onClose }) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleOtpSubmit = async () => {
    if (!otp.trim()) {
      setMessage("❌ Please enter OTP");
      return;
    }
    setLoading(true);
    try {
      const otpData = {
        tempUserId: userId,
        code: otp,
      };
      
      console.log("Submitting OTP data:", otpData);
      
      const res = await axios.post(getApiUrl("/api/users/email_verfy"), otpData);

      console.log(res.data);
      console.log(userId)

      if (res.data) {
        // Store the token if it's included in the response
        if (res.data.token) {
          localStorage.setItem("token", res.data.token);
          console.log("Token saved from OTP verification");
        }
        
        setMessage("✅ OTP Verified! Account Activated.");
        // Redirect to home page after successful verification
        setTimeout(() => {
          onClose(); // Close the modal first
          navigate("/"); // Redirect to home page instead of login
          window.location.reload(); // Reload to update UI with logged-in state
        }, 2000);
      } else {
        setMessage(" Invalid OTP, try again.");
      }
    } catch (err) {
      setMessage(" Error verifying OTP");
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-70 z-50">
      <div className="max-w-md w-full mx-auto bg-gray-900 text-white rounded-xl shadow-lg p-6 space-y-6">
        <h2 className="text-lg font-medium text-gray-300">Enter OTP</h2>
        <p className="text-sm text-gray-400">
          Please enter the OTP sent to your email.
        </p>

        <input
          type="text"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="Enter OTP"
          className="w-full p-2 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        <button
          className="w-full px-4 py-2 bg-orange-400 hover:bg-orange-500 rounded-lg font-semibold"
          onClick={handleOtpSubmit}
          disabled={loading}
        >
          {loading ? "Verifying..." : "Submit OTP"}
        </button>

        {message && <p className="text-center text-sm">{message}</p>}

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg font-semibold"
        >
          Close
        </button>
      </div>
    </div>
  );
}
