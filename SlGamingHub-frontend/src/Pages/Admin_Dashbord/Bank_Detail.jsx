import React, { useState, useEffect } from "react";
import axios from "axios";
import BankDetailsDisplay from "../../Components/User_Components/BankDetailsDisplay";
import { getAllBanks, addBank, updateBank, deleteBank, initWithSampleData } from "../../utils/mockBankApi";

const BankDetails = () => {
  const [banks, setBanks] = useState([]);
  const [formData, setFormData] = useState({
    accountHolder: "",
    accountNumber: "",
    bankName: "",
    branch: "",
  });
  const [editId, setEditId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ message: "", type: "" }); // success, error, info

  // Fetch bank details
  useEffect(() => {
    // Initialize with sample data if none exists
    initWithSampleData();
    fetchBanks();
  }, []);

  const fetchBanks = () => {
    setLoading(true);
    try {
      // Get data from localStorage using our utility
      const banksData = getAllBanks();
      setBanks(banksData);
      setStatus({
        message: banksData.length > 0 ? "" : "No bank accounts found. Add one below.",
        type: banksData.length > 0 ? "" : "info"
      });
    } catch (err) {
      console.error("Error fetching banks:", err);
      setBanks([]);
      setStatus({
        message: "Error fetching bank data: " + err.message,
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle input change
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Add / Update bank details
  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editId) {
        // Update existing bank
        updateBank(editId, formData);
        setStatus({
          message: "Bank details updated successfully!",
          type: "success"
        });
      } else {
        // Add new bank
        addBank(formData);
        setStatus({
          message: "Bank details added successfully!",
          type: "success"
        });
      }
      
      // Reset form
      setFormData({ accountHolder: "", accountNumber: "", bankName: "", branch: "" });
      setEditId(null);
      
      // Refresh the list
      fetchBanks();
    } catch (err) {
      console.error("Error saving bank", err);
      setStatus({
        message: "Failed to save bank details: " + err.message,
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete bank
  const handleDelete = (id) => {
    if (!window.confirm("Are you sure you want to delete this bank account?")) {
      return;
    }
    
    setLoading(true);
    try {
      deleteBank(id);
      setStatus({
        message: "Bank deleted successfully!",
        type: "success"
      });
      
      // Refresh the list
      fetchBanks();
    } catch (err) {
      console.error("Error deleting bank", err);
      setStatus({
        message: "Failed to delete bank: " + err.message,
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Edit bank
  const handleEdit = (bank) => {
    setFormData({
      accountHolder: bank.accountHolder || "",
      accountNumber: bank.accountNumber || "",
      bankName: bank.bankName || "",
      branch: bank.branch || ""
    });
    setEditId(bank._id);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Bank Account Management</h2>
          
          <button 
            onClick={fetchBanks}
            className="bg-blue-100 text-blue-700 px-3 py-2 rounded-md hover:bg-blue-200 transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
            Refresh
          </button>
        </div>

        {/* Status message */}
        {status.message && (
          <div className={`mb-6 p-4 rounded-md ${
            status.type === 'success' 
              ? 'bg-green-100 text-green-800 border-l-4 border-green-500' 
              : status.type === 'info'
                ? 'bg-blue-100 text-blue-800 border-l-4 border-blue-500'
                : 'bg-red-100 text-red-800 border-l-4 border-red-500'
          }`}>
            <div className="flex items-center">
              <span className={`mr-2 text-xl ${
                status.type === 'success' 
                  ? 'text-green-500' 
                  : status.type === 'info'
                    ? 'text-blue-500'
                    : 'text-red-500'
              }`}>
                {status.type === 'success' ? '✓' : status.type === 'info' ? 'ℹ' : '⚠'}
              </span>
              <p>{status.message}</p>
              <button 
                onClick={() => setStatus({ message: '', type: '' })} 
                className="ml-auto text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

      {/* Form */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h3 className="text-lg font-medium mb-4">{editId ? "Edit Bank Account" : "Add New Bank Account"}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="accountHolder" className="block text-sm font-medium text-gray-700 mb-1">
                Account Holder Name
              </label>
              <input
                type="text"
                id="accountHolder"
                name="accountHolder"
                value={formData.accountHolder}
                onChange={handleChange}
                placeholder="Enter account holder name"
                className="border border-gray-300 p-2 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleChange}
                placeholder="Enter account number"
                className="border border-gray-300 p-2 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleChange}
                placeholder="Enter bank name"
                className="border border-gray-300 p-2 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="branch" className="block text-sm font-medium text-gray-700 mb-1">
                Branch
              </label>
              <input
                type="text"
                id="branch"
                name="branch"
                value={formData.branch}
                onChange={handleChange}
                placeholder="Enter branch name"
                className="border border-gray-300 p-2 rounded-md w-full focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            {editId && (
              <button
                type="button"
                onClick={() => {
                  setFormData({ accountHolder: "", accountNumber: "", bankName: "", branch: "" });
                  setEditId(null);
                }}
                className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              className={`${loading ? 'bg-gray-500' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-md flex items-center justify-center transition-colors`}
              disabled={loading}
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {editId ? "Update Bank Account" : "Add Bank Account"}
            </button>
          </div>
        </form>
      </div>

      {/* Bank List */}
      <div className="bg-white shadow-md rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Bank Accounts</h3>
        
        {loading && banks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-3 text-gray-600">Loading bank details...</p>
          </div>
        ) : (
          <div>
            {/* Bank details preview using our component */}
            <div className="mb-6 border-b pb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Customer Preview</h4>
              <BankDetailsDisplay bankAccounts={banks} theme="light" />
            </div>
            
            {/* Admin table view */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 border text-left">Holder</th>
                    <th className="p-3 border text-left">Account No</th>
                    <th className="p-3 border text-left">Bank</th>
                    <th className="p-3 border text-left">Branch</th>
                    <th className="p-3 border text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {banks.map((bank) => (
                    <tr key={bank._id} className="hover:bg-gray-50">
                      <td className="p-3 border">{bank.accountHolder}</td>
                      <td className="p-3 border font-mono">{bank.accountNumber}</td>
                      <td className="p-3 border">{bank.bankName}</td>
                      <td className="p-3 border">{bank.branch}</td>
                      <td className="p-3 border">
                        <div className="flex justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(bank)}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(bank._id)}
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {banks.length === 0 && (
                    <tr>
                      <td colSpan="5" className="p-6 text-center text-gray-500">
                        No bank details found. Add your first bank account above.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
    </div>
  );
};

export default BankDetails;
