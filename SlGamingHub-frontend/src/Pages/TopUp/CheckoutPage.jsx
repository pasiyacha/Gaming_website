import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { getApiUrl, getApiHeaders } from "../../utils/apiUtils";
import { API_CONFIG } from "../../config/apiConfig";
import Header from "../../Components/User_Components/Header";
import Footer from "../../Components/User_Components/Footer";
import BankDetailsDisplay from "../../Components/User_Components/BankDetailsDisplay";
import { getAllBanks, initWithSampleData } from "../../utils/mockBankApi";
import { isLoggedIn, getUserId } from "../../utils/authUtils";
import { sendOrderNotificationToAdmin } from "../../utils/emailService";
import { sendOrderNotificationToAdminWhatsApp } from "../../utils/whatsappService";

// Helper function to check if a string is a valid MongoDB ObjectId
const isValidObjectId = (id) => {
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  return objectIdPattern.test(id);
};

function CheckoutPage() {
  const [orderDetails, setOrderDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(isLoggedIn());
  const [bankAccounts, setBankAccounts] = useState([]);
  const [file, setFile] = useState(null); // Payment slip file
  const [currentUserId, setCurrentUserId] = useState(null); // Store the current user ID
  const [paymentMethod, setPaymentMethod] = useState("bank"); // Default to bank transfer
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Initialize sample bank data if none exists
    initWithSampleData();

    // Load bank accounts
    const accounts = getAllBanks();
    setBankAccounts(accounts);

    // Check if user is authenticated
    if (!isLoggedIn()) {
      navigate("/auth/login", { state: { from: location.pathname } });
    } else {
      // Get the user ID from the JWT token
      const userId = getUserId();
      setCurrentUserId(userId);
      console.log("Current logged-in user ID:", userId);
    }

    // Get order details from location state
    if (location.state && location.state.orderDetails) {
      setOrderDetails(location.state.orderDetails);
    }
  }, [location, navigate]);
  
  // Handle file selection for bank slip
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("ORDER DEBUG - Form submission started");
    
    if (!file) {
      alert(`Please upload your ${paymentMethod === "bank" ? "bank slip" : "eZcash payment screenshot"} to complete the order.`);
      return;
    }
    
    setLoading(true);
    console.log("ORDER DEBUG - Starting file reader");
    
    // Read file as data URL for bank slip
    const reader = new FileReader();
    
    reader.onerror = function(error) {
      console.error("ORDER DEBUG - FileReader error:", error);
      setLoading(false);
      alert("Error reading the uploaded file. Please try again with a different file.");
    };
    
    reader.onload = function (event) {
      console.log("ORDER DEBUG - File successfully read");
      const receiptDataUrl = event.target.result;
      
      // Generate order number
      const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      
      // Build order object
      const completedOrder = {
        orderId: orderNumber,
        orderNumber: orderNumber,
        game: orderDetails?.gameName || "",
        userId: currentUserId || "", // Use the MongoDB user ID from JWT token
        playerName: orderDetails?.username || "",
        playerId: orderDetails?.playerId || "", // This is the game account ID
        packageId: orderDetails?.packageId || "",
        packageName: orderDetails?.packageName || "",
        quantity: 1, // Always set to 1
        totalPrice: parsePriceString(orderDetails?.packagePrice) || 0,
        date: orderDetails?.date || new Date().toISOString(), // Store as ISO string for MongoDB compatibility
        receipt: receiptDataUrl, // Add the payment slip image
        paymentMethod: paymentMethod, // Add the payment method (bank or ezcash)
        status: "pending"
      };
      
      // Helper function to parse price strings correctly
      function parsePriceString(priceStr) {
        if (!priceStr) return 0;
        
        if (typeof priceStr === 'string') {
          // Remove currency symbol and commas, keep only digits and decimal point
          const cleanedPrice = priceStr.replace(/[^\d.]/g, '');
          
          // If the price is in format like "Rs.120.00", we want 120.00
          const priceAsNumber = parseFloat(cleanedPrice);
          
          // If the number is less than 1 but has 3 or more digits after decimal,
          // it's likely a parsing issue where "120.00" became "0.12000"
          if (priceAsNumber < 1 && cleanedPrice.length >= 3) {
            // Multiply by 1000 to correct (0.12 → 120)
            return priceAsNumber * 1000;
          }
          return priceAsNumber;
        }
        
        return parseFloat(priceStr) || 0;
      }
      
      // Log for debugging
      console.log("ORDER DEBUG - Preparing to save order:", completedOrder);
      
      // Save to localStorage
      try {
        const prevOrders = JSON.parse(localStorage.getItem("completedOrders") || "[]");
        localStorage.setItem("completedOrders", JSON.stringify([...prevOrders, completedOrder]));
        console.log("ORDER DEBUG - Order saved to localStorage successfully");
      } catch (error) {
        console.error("ORDER DEBUG - Failed to save order to localStorage:", error);
      }
      
      // Initialize promises array for all async operations
      const promises = [];
      
      // Enhanced order details with additional information
      const notificationOrderDetails = {
        ...orderDetails,
        orderNumber,
        receiptImage: true, // Add flag indicating receipt is available
        // Add these fields to ensure compatibility with all functions
        gameName: orderDetails?.gameName || "",
        game: orderDetails?.gameName || "",
        packageName: orderDetails?.packageName || "",
        packagePrice: orderDetails?.packagePrice || "",
        totalPrice: parsePriceString(orderDetails?.packagePrice) || 0, // Use our helper function
        userId: currentUserId || "", // Use the MongoDB user ID from JWT token
        playerId: orderDetails?.playerId || "", // Keep the game player ID 
        username: orderDetails?.username || "",
        playerName: orderDetails?.username || ""
      };
      
      // Send to MongoDB server
      // Get authentication token
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("ORDER DEBUG - No authentication token found");
      } else {
        // Check if IDs are valid MongoDB ObjectIds
        if (!isValidObjectId(completedOrder.userId)) {
          console.warn("ORDER DEBUG - Invalid user ID format for MongoDB:", completedOrder.userId);
        }
        
        if (!isValidObjectId(completedOrder.packageId)) {
          console.warn("ORDER DEBUG - Invalid package ID format for MongoDB:", completedOrder.packageId);
        }
        
        // First, check if we have valid MongoDB ObjectIds or provide fallbacks
        const validUserId = currentUserId && isValidObjectId(currentUserId) ? 
          currentUserId : 
          "650420d6359fa3cf64d98d4e"; // Fallback user ID - replace with your admin ID
          
        const validPackageId = isValidObjectId(completedOrder.packageId) ? 
          completedOrder.packageId : 
          "65041bb3359fa3cf64d98d4c"; // Fallback package ID - replace with a default package
        
        // Create a FormData object for file upload
        const formData = new FormData();
        
        // Add order details to FormData
        formData.append("userId", validUserId);
        formData.append("playerName", completedOrder.playerName || "Guest User");
        formData.append("playerId", completedOrder.playerId || "Guest ID");
        formData.append("packageId", validPackageId);
        formData.append("quantity", 1);
        formData.append("totalPrice", completedOrder.totalPrice);
        formData.append("paymentMethod", paymentMethod);
        formData.append("status", "pending");
        
        // Convert the receipt data URL to a Blob and append to FormData
        if (completedOrder.receipt && completedOrder.receipt.startsWith('data:')) {
          // Create a Blob from the data URL
          const matches = completedOrder.receipt.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          
          if (matches && matches.length === 3) {
            const contentType = matches[1];
            const base64Data = matches[2];
            const byteCharacters = atob(base64Data);
            const byteArrays = [];
            
            for (let i = 0; i < byteCharacters.length; i += 512) {
              const slice = byteCharacters.slice(i, i + 512);
              const byteNumbers = new Array(slice.length);
              
              for (let j = 0; j < slice.length; j++) {
                byteNumbers[j] = slice.charCodeAt(j);
              }
              
              byteArrays.push(new Uint8Array(byteNumbers));
            }
            
            const blob = new Blob(byteArrays, { type: contentType });
            const file = new File([blob], "receipt.jpg", { type: contentType });
            
            // Append the file to FormData with the correct field name
            formData.append("recipt", file);
          } else {
            console.error("ORDER DEBUG - Failed to parse data URL");
            // Create a fallback text entry instead of trying to create a file
            formData.append("recipt", "Data URL parsing failed");
          }
        } else if (file) {
          // If we have a direct file object from the file input, use it
          formData.append("recipt", file);
        } else {
          // Fallback if no receipt
          formData.append("recipt", "No receipt provided");
        }
        
        // Add MongoDB save promise to the promises array
        promises.push(
          axios.post(
            getApiUrl(API_CONFIG.ENDPOINTS.ORDERS),
            formData,
            {
              headers: {
                Authorization: `Bearer ${token}`
                // Don't set Content-Type - FormData will set it automatically with boundaries
              }
            }
          )
          .then(response => {
            console.log("ORDER DEBUG - Order saved to MongoDB successfully:", response.data);
            // Update the completedOrder with the MongoDB ID for reference
            if (response.data && response.data._id) {
              const updatedOrder = {...completedOrder, mongoDbId: response.data._id};
              // Update in localStorage to maintain the reference
              const prevOrders = JSON.parse(localStorage.getItem("completedOrders") || "[]");
              const updatedOrders = [...prevOrders.filter(o => o.orderId !== updatedOrder.orderId), updatedOrder];
              localStorage.setItem("completedOrders", JSON.stringify(updatedOrders));
            }
            return { type: 'mongoDbSave', success: true };
          })
          .catch(error => {
            console.error("ORDER DEBUG - Failed to save order to MongoDB:", error);
            
            // Get more detailed error information
            if (error.response) {
              // The request was made and the server responded with a status code
              // that falls out of the range of 2xx
              console.error("ORDER DEBUG - Server response data:", error.response.data);
              console.error("ORDER DEBUG - Server response status:", error.response.status);
              console.error("ORDER DEBUG - Server response headers:", error.response.headers);
              
              // Show alert with more details
              const errorMessage = error.response.data.message || "Unknown server error";
              alert(`MongoDB save error: ${errorMessage}. Order saved to local storage as backup.`);
            } else if (error.request) {
              // The request was made but no response was received
              console.error("ORDER DEBUG - No response received:", error.request);
              alert("Could not reach the server. Order saved to local storage as backup.");
            } else {
              // Something happened in setting up the request that triggered an Error
              console.error('ORDER DEBUG - Error message:', error.message);
              alert(`Error: ${error.message}. Order saved to local storage as backup.`);
            }
            
            // We'll still consider the order successful even if the MongoDB save fails
            return { type: 'mongoDbSave', success: false, error };
          })
        );
      }
      
      // Admin email notification
      promises.push(
        sendOrderNotificationToAdmin(notificationOrderDetails)
          .catch(error => {
            console.error("EMAIL DEBUG - Failed to send admin email:", error);
            return { type: 'adminEmail', success: false, error };
          })
      );
      
      // Admin WhatsApp notification
      promises.push(
        sendOrderNotificationToAdminWhatsApp(notificationOrderDetails)
          .catch(error => {
            console.error("WHATSAPP DEBUG - Failed to send admin WhatsApp:", error);
            return { type: 'adminWhatsapp', success: false, error };
          })
      );
      
      console.log("ORDER DEBUG - All promises created, calling Promise.all with", promises.length, "promises");
      
      // Process all notification promises
      Promise.all(promises)
        .then(results => {
          console.log("ORDER DEBUG - All promises resolved:", results);
          // Check if MongoDB save was successful
          const mongoResult = results.find(r => r && r.type === 'mongoDbSave');
          if (mongoResult && mongoResult.success) {
            console.log("ORDER DEBUG - MongoDB save was successful");
          } else {
            console.warn("ORDER DEBUG - MongoDB save failed, but continuing with localStorage backup");
          }
          setLoading(false);
          setSuccess(true);
          setTimeout(() => {
            navigate("/");
          }, 5000); // Give user more time to see the success message
        })
        .catch(error => {
          console.error("ORDER DEBUG - Error in promise handling:", error);
          setLoading(false);
          setSuccess(true); // Still mark as success since the order was saved
          setTimeout(() => {
            navigate("/");
          }, 5000);
        });
    };
    
    try {
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("ORDER DEBUG - Error reading file:", error);
      setLoading(false);
      alert("Error reading the uploaded file. Please try again with a different file.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">Complete Your Payment</h1>
        
        {/* Order Summary */}
        {orderDetails && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold mb-4 text-blue-900">Order Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-gray-600 mb-2">Game:</p>
                <p className="font-medium">{orderDetails.gameName}</p>
                
                <p className="text-gray-600 mt-4 mb-2">User ID:</p>
                {currentUserId ? (
                  <p className="font-medium bg-purple-50 p-2 rounded border-l-4 border-purple-500">
                    {currentUserId}
                  </p>
                ) : (
                  <p className="font-medium text-gray-500 bg-gray-50 p-2 rounded border-l-4 border-gray-400">
                    Not available
                  </p>
                )}
                
                <p className="text-gray-600 mt-4 mb-2">Player ID:</p>
                {orderDetails.playerId && orderDetails.playerId.trim() !== "" ? (
                  <p className="font-medium bg-blue-50 p-2 rounded border-l-4 border-blue-500">
                    {orderDetails.playerId}
                  </p>
                ) : (
                  <p className="font-medium text-red-500 bg-red-50 p-2 rounded border-l-4 border-red-500">
                    Not provided - Please go back and enter your Player ID
                  </p>
                )}
                
                <p className="text-gray-600 mt-4 mb-2">Username:</p>
                {orderDetails.username && orderDetails.username.trim() !== "" ? (
                  <p className="font-medium bg-blue-50 p-2 rounded border-l-4 border-blue-500">
                    {orderDetails.username}
                  </p>
                ) : (
                  <p className="font-medium text-yellow-500 bg-yellow-50 p-2 rounded border-l-4 border-yellow-500">
                    Not provided
                  </p>
                )}
              </div>
              
              <div>
                <p className="text-gray-600 mb-2">Package:</p>
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-orange-300 rounded-full flex items-center justify-center mr-2">
                    <span className="text-lg font-bold text-blue-900">💎</span>
                  </div>
                  <div>
                    <p className="font-medium">{orderDetails.packageName}</p>
                    <p className="text-sm text-gray-500">{orderDetails.packageDescription}</p>
                  </div>
                </div>
                
                <p className="text-gray-600 mt-4 mb-2">Amount:</p>
                <p className="font-bold text-xl text-green-600">{orderDetails.packagePrice}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Payment Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 text-blue-900">Payment Instructions</h2>
          
          <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-4">
            <p className="text-blue-700">
              Please transfer the exact amount using your preferred payment method and upload your payment slip.
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div className="bg-white rounded p-2 shadow-sm">
                <span className="font-semibold">Amount to Pay:</span> 
                <span className="text-green-600 font-bold ml-2">
                  {orderDetails?.packagePrice || "0.00"}
                </span>
              </div>
              <div className="bg-white rounded p-2 shadow-sm">
                <span className="font-semibold">Reference:</span> 
                <span className="text-blue-600 font-mono ml-2">
                  SL-{orderDetails?.playerId?.substring(0, 6) || "GAMING"}
                </span>
              </div>
            </div>
          </div>
          
          {/* Payment Method Selection */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Select Payment Method</h3>
            
            <div className="flex border border-gray-300 rounded-lg overflow-hidden">
              <button
                type="button"
                onClick={() => setPaymentMethod("bank")}
                className={`flex-1 py-3 px-4 flex items-center justify-center ${
                  paymentMethod === "bank" 
                    ? "bg-blue-100 border-b-2 border-blue-500 text-blue-800" 
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                  <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                </svg>
                <span className="flex flex-col items-start">
                  <span>Bank Transfer</span>
                  <span className="text-xs text-blue-600 font-light">Standard processing</span>
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("ezcash")}
                className={`flex-1 py-3 px-4 flex items-center justify-center relative ${
                  paymentMethod === "ezcash" 
                    ? "bg-green-100 border-b-2 border-green-500 text-green-800" 
                    : "bg-white text-gray-600 hover:bg-gray-50"
                }`}
              >
                <span className="absolute -top-2 right-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full font-medium shadow-sm">
                  Recommended
                </span>
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
                </svg>
                <span className="flex flex-col items-start">
                  <span>eZcash</span>
                  <span className="text-xs text-green-600 font-light">Fast processing</span>
                </span>
              </button>
            </div>
          </div>
          
          {/* Payment Details */}
          <div className="bg-gray-50 p-6 rounded-lg mb-6 border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
              {paymentMethod === "bank" ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  Bank Account Information
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.498 14.382c-.301-.15-1.767-.867-2.04-.966-.273-.101-.473-.15-.673.15-.197.295-.771.964-.944 1.162-.175.195-.349.21-.646.075-.3-.15-1.263-.465-2.403-1.485-.888-.795-1.484-1.77-1.66-2.07-.174-.3-.019-.465.13-.615.136-.135.301-.345.451-.523.146-.181.194-.301.297-.496.1-.21.049-.375-.025-.524-.075-.15-.672-1.62-.922-2.206-.24-.584-.487-.51-.672-.51-.172-.015-.371-.015-.571-.015-.2 0-.523.074-.797.359-.273.3-1.045 1.02-1.045 2.475s1.07 2.865 1.219 3.075c.149.195 2.105 3.195 5.1 4.485.714.3 1.27.48 1.704.629.714.227 1.365.195 1.88.121.574-.091 1.767-.721 2.016-1.426.255-.705.255-1.29.18-1.425-.074-.135-.27-.21-.57-.345m-5.446 7.443h-.016c-1.77 0-3.524-.48-5.055-1.38l-.36-.214-3.75.975 1.005-3.645-.239-.375c-.99-1.576-1.516-3.391-1.516-5.26 0-5.445 4.455-9.885 9.942-9.885 2.654 0 5.145 1.035 7.021 2.91 1.875 1.859 2.909 4.35 2.909 6.99-.004 5.444-4.46 9.885-9.935 9.885M20.52 3.449C18.24 1.245 15.24 0 12.045 0 5.463 0 .104 5.334.101 11.893c0 2.096.549 4.14 1.595 5.945L0 24l6.335-1.652c1.746.943 3.71 1.444 5.71 1.447h.006c6.585 0 11.946-5.336 11.949-11.896 0-3.176-1.24-6.165-3.495-8.411" />
                  </svg>
                  eZcash Information
                </>
              )}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              {paymentMethod === "bank" ? (
                "Please transfer the exact amount to one of the following bank accounts and upload the payment slip to complete your order."
              ) : (
                "Please send the exact amount to one of the following eZcash numbers and upload a screenshot of the payment to complete your order."
              )}
            </p>
            
            <div className="bg-white rounded-lg shadow-sm p-4">
              <BankDetailsDisplay 
                bankAccounts={bankAccounts} 
                theme="light"
                className="mt-2"
                paymentType={paymentMethod}
              />
            </div>
            
            <div className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 text-sm">
              <p className="text-yellow-700">
                <strong>Important:</strong> {paymentMethod === "bank" 
                  ? "Please include your Player ID as the reference when making the bank transfer."
                  : "Please mention your Player ID in the eZcash payment message or note."
                } This will help us identify your payment quickly.
              </p>
            </div>
            
            {/* Payment Instructions in Sinhala */}
            <div className="mt-4 bg-yellow-100 border border-yellow-300 rounded-lg p-4 text-sm">
              <h4 className="font-bold text-yellow-800 mb-2">මුදල් ගෙවීමේ උපදෙස්</h4>
              <ul className="space-y-2 text-yellow-800">
                {paymentMethod === "bank" ? (
                  <>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>නිවැරදි ගිණුම් තොරතුරු වලට අදාල මුදල බැර කරන්න</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>අද දිනයේ මුදල් ගෙවීම් සදහා පමණක් top-up ලබා ගත හැක</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>මුදල් දැමීමේදී රිසිට් 2 ක් ඇත්නම් 2 ම එක image එකකින් පහලින් uplode කරන්න</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>කිහිපවරක් එකම රිසිට් පත එවීමෙන් ඔබව web side එකෙන් banned වනු ඇත</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>නිවැරදි eZcash අංකයට මුදල් යොමු කරන්න</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>ගෙවීම් කරන විට ඔබේ Player ID සඳහන් කරන්න</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>අද දිනයේ මුදල් ගෙවීම් සදහා පමණක් top-up ලබා ගත හැක</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>ගෙවීම් සිදු කල පසු ඔබට ලැබෙන SMS එක හෝ ගෙවීම් තහවුරුව screenshot කර upload කරන්න</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>කිහිපවරක් එකම ගෙවීම් තහවුරුව එවීමෙන් ඔබව web side එකෙන් banned වනු ඇත</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
          </div>
          
          {/* Contact Information Form */}
          {!success ? (
            <form onSubmit={handleSubmit} className="mt-6">
              <h3 className="font-medium text-gray-700 mb-4">Payment Confirmation</h3>
              
              {/* Payment Slip Upload */}
              <div className="mb-6">
                <label htmlFor="payment-slip" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload {paymentMethod === "bank" ? "Bank" : "eZcash"} Payment Slip
                </label>
                <div className={`border-2 border-dashed rounded-lg p-6 text-center ${paymentMethod === "bank" ? "border-blue-300" : "border-green-300"}`}>
                  <input
                    type="file"
                    id="payment-slip"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  
                  <label
                    htmlFor="payment-slip"
                    className="cursor-pointer block"
                  >
                    <div className="text-center">
                      {paymentMethod === "bank" ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                      ) : (
                        <svg className="mx-auto h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                        </svg>
                      )}
                      
                      <p className="mt-2 text-sm text-gray-600">
                        Click to select {paymentMethod === "bank" ? "bank slip" : "eZcash screenshot"} or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, PDF up to 10MB
                      </p>
                    </div>
                  </label>
                  
                  {file && (
                    <div className={`mt-4 p-3 rounded-lg flex items-center ${paymentMethod === "bank" ? "bg-blue-50" : "bg-green-50"}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mr-2 ${paymentMethod === "bank" ? "text-blue-500" : "text-green-500"}`} viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z" clipRule="evenodd" />
                      </svg>
                      <span className={`text-sm ${paymentMethod === "bank" ? "text-blue-700" : "text-green-700"}`}>
                        {file.name}
                      </span>
                    </div>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">
                  {paymentMethod === "bank" 
                    ? "Please upload a screenshot or photo of your bank transfer receipt."
                    : "Please upload a screenshot of your eZcash transaction or confirmation message."}
                </p>
              </div>
              
              <div className={`${paymentMethod === "bank" ? "bg-blue-50 border-l-4 border-blue-500" : "bg-green-50 border-l-4 border-green-500"} p-4 mb-6`}>
                <p className={`${paymentMethod === "bank" ? "text-blue-700" : "text-green-700"} text-sm`}>
                  <strong>Important:</strong> {paymentMethod === "bank" 
                    ? "Please ensure your bank reference number is visible in the payment slip to speed up verification." 
                    : "Please ensure the eZcash transaction number and timestamp are visible in the screenshot."}
                </p>
                
                {/* Debug information - only visible during development */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 p-2 bg-gray-100 rounded">
                    <p className="text-xs text-gray-700 mb-1">Debug Information:</p>
                    <p className="text-xs text-gray-700">MongoDB User ID: {currentUserId || 'Not available'}</p>
                    <p className="text-xs text-gray-700">Player ID (Game): {orderDetails?.playerId || 'Not provided'}</p>
                    <p className="text-xs text-gray-700">Package ID: {orderDetails?.packageId || 'Not provided'}</p>
                    <button
                      type="button"
                      onClick={() => {
                        console.log('Debug - Order Details:', orderDetails);
                        console.log('Debug - Current User ID:', currentUserId);
                        alert(`MongoDB User ID: ${currentUserId || 'Not available'}\nPlayer ID: ${orderDetails?.playerId || 'Not provided'}\nPackage ID: ${orderDetails?.packageId || 'Not provided'}`);
                      }}
                      className="text-xs bg-gray-200 px-2 py-1 mt-1 rounded hover:bg-gray-300"
                    >
                      Debug IDs
                    </button>
                  </div>
                )}
              </div>
              
              <div className="flex justify-center mt-6">
                <button
                  type="submit"
                  disabled={!file || loading}
                  className={`${
                    !file || loading ? 'bg-gray-400 cursor-not-allowed' : 
                    paymentMethod === "bank" ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                  } text-white font-bold py-3 px-8 rounded-lg transition-colors flex items-center justify-center`}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Processing...
                    </>
                  ) : (
                    `Complete Order with ${paymentMethod === "bank" ? "Bank Transfer" : "eZcash"}`
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-xl font-medium text-green-800 mb-2">Order Placed Successfully!</h3>
              <p className="text-green-600">
                Your order has been recorded and {paymentMethod === "bank" ? "bank slip" : "eZcash payment proof"} received.
              </p>
              <p className="text-green-700 mt-3">
                Your game credits will be added to your account {paymentMethod === "bank" ? "within 1 business day" : "typically within 2-3 hours"} after payment verification.
              </p>
              {paymentMethod === "ezcash" && (
                <p className="text-green-700 mt-2">
                  <span className="font-semibold">eZcash Support:</span> For payment issues, contact customer service at 0773043667.
                </p>
              )}
              <p className="text-green-600 mt-3">Redirecting to home page...</p>
            </div>
          )}
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

export default CheckoutPage;
