import React, { useState, useEffect } from "react";
import axios from "axios";
import { isLoggedIn } from "../../utils/authUtils";
import bankService from "../../services/bankService";

const PaymentMethod = () => {
  const [banks, setBanks] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn());

  // Fetch bank details from mock API
  useEffect(() => {
    // Check auth status first
    setIsAuthenticated(isLoggedIn());
    
    const fetchBankDetails = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Try to get bank details from API
        const bankData = await bankService.getAllBanks();
        setBanks(bankData || []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching bank details from API:", err);
        // Fallback to localStorage
        try {
          const fallbackService = bankService.fallbackToLocalStorage();
          const bankData = fallbackService.getAllBanks();
          setBanks(bankData || []);
          setLoading(false);
        } catch (fallbackErr) {
          console.error("Error with fallback bank details:", fallbackErr);
          setError("Could not load bank details. Please try again later.");
          setLoading(false);
        }
      }
    };
    
    // Fetch bank details when component mounts or auth status changes
    fetchBankDetails();
    
    // Listen for auth changes
    const handleAuthChange = () => {
      setIsAuthenticated(isLoggedIn());
      fetchBankDetails();
    };
    
    window.addEventListener('authChange', handleAuthChange);
    window.addEventListener('storage', (e) => {
      if (e.key === 'token') {
        setIsAuthenticated(!!e.newValue);
        fetchBankDetails();
      }
    });
    
    return () => {
      window.removeEventListener('authChange', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) {
      alert("Please upload your bank slip first.");
      return;
    }
    // Replace with actual API call to upload bank slip
    alert(`Bank slip "${file.name}" uploaded successfully!`);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-10">
      {/* Left side → Bank Details */}
      <div className="bg-[#0e08ab] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Bank Details</h2>
        
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-white"></div>
          </div>
        ) : error ? (
          <div className="bg-red-500 p-4 rounded-lg text-white text-center">
            {error}
          </div>
        ) : banks.length === 0 ? (
          <div className="text-center p-4 bg-blue-900 rounded-lg">
            <p>No bank details available. Please contact support.</p>
          </div>
        ) : (
          <div>
            <div className="bg-blue-800 p-3 rounded-lg mb-4 text-center">
              <p className="text-yellow-300 font-semibold">Please transfer the exact amount to one of these accounts</p>
            </div>
            <table className="w-full border border-gray-400">
              <thead className="bg-gray-700">
                <tr>
                  <th className="border p-2">Holder</th>
                  <th className="border p-2">Account No</th>
                  <th className="border p-2">Bank</th>
                  <th className="border p-2">Branch</th>
                </tr>
              </thead>
              <tbody>
                {banks.map((bank) => (
                  <tr key={bank._id} className="text-center bg-[#1a1380] hover:bg-blue-900 transition-colors">
                    <td className="border p-2">{bank.accountHolder}</td>
                    <td className="border p-2 font-mono">{bank.accountNumber}</td>
                    <td className="border p-2">{bank.bankName}</td>
                    <td className="border p-2">{bank.branch}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Right side → Bank Slip Upload */}
      <div className="bg-[#0e08ab] text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Upload Bank Slip</h2>
        <div className="bg-green-600 rounded-lg p-6 flex flex-col gap-4">
          <label className="text-sm font-medium">
            Please upload your bank slip as proof of payment:
          </label>

          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="block w-full text-sm text-black file:mr-4 file:py-2 file:px-4 
                       file:rounded-lg file:border-0 file:text-sm file:font-semibold 
                       file:bg-purple-600 file:text-white hover:file:bg-purple-700"
          />

          {file && (
            <p className="text-sm text-gray-200">
              Selected file: <span className="font-semibold">{file.name}</span>
            </p>
          )}

          <button
            onClick={handleUpload}
            className="bg-orange-500 p-3 rounded-lg hover:bg-orange-400 mt-2"
          >
            Upload Bank Slip
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethod;
