import React, { useState, useEffect } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { sendEmail } from "../../utils/emailService";
import { sendWhatsAppMessage, getWhatsAppLink } from "../../utils/whatsappService";
import waIcon from "../../assets/Banner/WhatsApp.png";
import { getApiUrl, getApiHeaders } from "../../utils/apiUtils";
import { API_CONFIG } from "../../config/apiConfig";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [messageType, setMessageType] = useState("email"); // "email" or "whatsapp"
  const [emailSubject, setEmailSubject] = useState("");
  const [messageBody, setMessageBody] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageStatus, setMessageStatus] = useState({ success: false, message: "" });
  const [receiptImage, setReceiptImage] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const { orderId } = useParams();

  useEffect(() => {
    // Load orders from the server only
    setLoading(true);
    setError("");
    
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          // Get orders with populated user and package data - already populated from backend
          const response = await axios.get(getApiUrl("/api/order"), {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          // Format server orders only (no localStorage orders)
          const serverOrders = response.data.map(order => {
            // Get related data from populated fields
            const user = order.userId || {}; // Now populated from backend
            const packageInfo = order.packageId || {}; // Now populated from backend
            const gameInfo = packageInfo.gameId || {}; // Get game info from package
            
            return {
              orderId: order._id,
              orderNumber: order._id.substring(0, 8),
              game: gameInfo.gamename || "Unknown Game",
              userId: order.userId?._id || order.userId,
              playerName: order.playerName,
              playerId: order.playerId,
              packageId: order.packageId?._id || order.packageId,
              packageName: packageInfo.packagename || "Unknown Package",
              totalPrice: order.totalPrice,
              date: new Date(order.date).toLocaleString(),
              receiptImage: order.recipt,
              status: order.status,
              email: user.email || order.email,
              phone: user.phone || order.phone,
              mongoDbId: order._id // Mark as coming from MongoDB
            };
          });
          
          setOrders(serverOrders);
        } else {
          // If no token, show empty orders list and an error
          setOrders([]);
          setError("Authentication required. Please log in to view orders.");
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching orders:", err);
        setOrders([]);
        setError("Failed to load orders from server. Please try again later.");
        setLoading(false);
      }
    };
    
    fetchOrders();
  }, [orderId]);

  // 🔍 Filter orders by search text
  const filteredOrders = orders.filter((order) =>
    Object.values(order).some((value) =>
      String(value).toLowerCase().includes(search.toLowerCase())
    )
  );

  // ✅ Handle status change
  const handleStatusChange = (id, newStatus, currentStatus) => {
    // If the status is the same, do nothing
    if (currentStatus === newStatus) return;
    
    // Update local state first for immediate UI feedback
    const updatedOrders = orders.map((order) =>
      order.orderId === id ? { ...order, status: newStatus } : order
    );
    setOrders(updatedOrders);
    
    // Update server only (no localStorage)
    const token = localStorage.getItem("token");
    if (token) {
      // All orders should be MongoDB IDs now
      axios
        .patch(`${getApiUrl("/api/order/status")}/${id}`, 
          { status: newStatus },
          { 
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        )
        .then((res) => {
          console.log("Status updated on server:", res.data);
          
          // Show notification if status is completed
          if (newStatus === "completed") {
            setMessageStatus({
              success: true,
              message: "Order marked as completed. A confirmation email has been sent to the customer."
            });
            
            // Clear the notification after 5 seconds
            setTimeout(() => {
              setMessageStatus({ success: false, message: "" });
            }, 5000);
          }
        })
        .catch((err) => {
          console.error("Error updating status on server:", err);
          // Show error message to user
          setError("Failed to update order status on server. Please try again.");
          setTimeout(() => setError(""), 3000);
        });
    }
  };

  // Handle opening the message modal
  const openMessageModal = (order, type = "email") => {
    setSelectedOrder(order);
    setMessageType(type);
    
    // Default subject and message based on type
    if (type === "email") {
      setEmailSubject(`Update on your order ${order.orderNumber || order.orderId}`);
      setMessageBody(`Dear ${order.playerName || 'Customer'},\n\nYour order for ${order.packageName} in ${order.game} has been processed. Your account with Player ID ${order.playerId || '[Player ID]'} will be credited within the next few hours.\n\nThank you for choosing SL Gaming Hub!\n\nBest regards,\nSL Gaming Hub Team`);
    } else {
      // WhatsApp message (no subject needed)
      setMessageBody(`*Update on your SL Gaming Hub order*\n\nDear ${order.playerName || 'Customer'},\n\nYour order for ${order.packageName} in ${order.game} has been processed. Your account with Player ID *${order.playerId || '[Player ID]'}* will be credited within the next few hours.\n\nThank you for choosing SL Gaming Hub!\n\nBest regards,\nSL Gaming Hub Team`);
    }
  };

  // Get direct WhatsApp link
  const getDirectWhatsAppLink = (order) => {
    if (!order || !order.phone) return "#";
    
    const defaultMessage = `Hello! I'm from SL Gaming Hub regarding your order ${order.orderNumber || order.orderId}. How can I help you?`;
    return getWhatsAppLink(order.phone, defaultMessage);
  };

  // Handle viewing receipt image
  const handleViewReceipt = (order) => {
    let imageUrl = order.recipt || order.receiptImage;
    if (!imageUrl) {
      alert("No receipt image available for this order.");
      return;
    }
    
    // Check if the URL already includes the API base URL
    const apiBaseUrl = API_CONFIG.BASE_URL.replace('/api', ''); // Remove '/api' suffix if present
    
    if (imageUrl.startsWith('http')) {
      // If it's already a full URL, use it as is
      console.log("Using existing full URL:", imageUrl);
    } 
    // If it's a server path starting with /uploads/
    else if (imageUrl.startsWith('/uploads/')) {
      // Remove the API path part and add the base URL
      console.log("Converting /uploads/ path to full URL");
      imageUrl = `${apiBaseUrl}${imageUrl}`;
    }
    // If it's a data URL, use as is
    else if (imageUrl.startsWith('data:')) {
      console.log("Using data URL as is");
    }
    // Otherwise, treat as a filename and prepend base URL + /uploads/
    else {
      console.log("Treating as a filename, adding full path");
      imageUrl = `${apiBaseUrl}/uploads/${imageUrl}`;
    }
    
    console.log("Displaying receipt image:", imageUrl);
    setReceiptImage(imageUrl);
    setShowReceiptModal(true);
  };

  // Send message to customer
  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!selectedOrder) {
      setMessageStatus({
        success: false,
        message: "No order selected"
      });
      return;
    }
    
    // Check if contact info exists for selected message type
    if (messageType === "email" && !selectedOrder.email) {
      setMessageStatus({
        success: false,
        message: "No email address found for this customer"
      });
      return;
    }
    
    if (messageType === "whatsapp" && !selectedOrder.phone) {
      setMessageStatus({
        success: false,
        message: "No phone number found for this customer"
      });
      return;
    }
    
    setSendingMessage(true);
    setMessageStatus({ success: false, message: "" });
    
    try {
      let result;
      
      if (messageType === "email") {
        // Send email
        result = await sendEmail({
          to: selectedOrder.email,
          subject: emailSubject,
          body: messageBody,
          from: "orders@16.170.236.106"
        });
        
        // Update order with email sent timestamp
        const updatedOrders = orders.map((order) =>
          order.orderId === selectedOrder.orderId 
            ? { 
                ...order, 
                emailsSent: [...(order.emailsSent || []), {
                  subject: emailSubject,
                  timestamp: new Date().toISOString()
                }]
              } 
            : order
        );
        setOrders(updatedOrders);
        localStorage.setItem("completedOrders", JSON.stringify(updatedOrders));
        
        setMessageStatus({
          success: true,
          message: `Email sent successfully to ${selectedOrder.email}`
        });
      } else {
        // Send WhatsApp
        result = await sendWhatsAppMessage({
          to: selectedOrder.phone,
          message: messageBody
        });
        
        // Update order with WhatsApp sent timestamp
        const updatedOrders = orders.map((order) =>
          order.orderId === selectedOrder.orderId 
            ? { 
                ...order, 
                whatsappSent: [...(order.whatsappSent || []), {
                  timestamp: new Date().toISOString()
                }]
              } 
            : order
        );
        setOrders(updatedOrders);
        localStorage.setItem("completedOrders", JSON.stringify(updatedOrders));
        
        setMessageStatus({
          success: true,
          message: `WhatsApp message sent successfully to ${selectedOrder.phone}`
        });
      }
      
      // Close modal after 2 seconds on success
      setTimeout(() => {
        setSelectedOrder(null);
      }, 2000);
    } catch (error) {
      setMessageStatus({
        success: false,
        message: `Failed to send ${messageType}: ${error.message}`
      });
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="p-4 sm:p-6">
      <h2 className="text-xl font-bold mb-4">Orders</h2>

      <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-4 mb-4 rounded">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm">
              This page now shows only server-stored orders. Locally stored orders are no longer displayed.
            </p>
          </div>
        </div>
      </div>

      {/* 🔍 Search Bar */}
      <input
        type="text"
        placeholder="Search by Order ID, User, Player..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border p-2 mb-4 w-full sm:w-[300px] rounded"
      />

      {loading ? (
        <div className="text-center py-4">
          <p>Loading orders...</p>
        </div>
      ) : error ? (
        <div className="text-center py-4 text-red-500">
          <p>{error}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <p>No orders found.</p>
      ) : (
        <div className="grid gap-4">
          {filteredOrders.map((order, idx) => (
            <div key={order.orderId || idx} className="bg-gray-100 rounded shadow p-4 flex flex-col sm:flex-row sm:items-start justify-between">
              <div className="flex-grow">
                <div className="font-bold text-lg mb-2">Order ID: {order.orderNumber || order.orderId}</div>
                <div className="text-sm text-gray-700 mb-1">Game: {order.game}</div>
                <div className="text-sm text-gray-700 mb-1">User ID: {order.userId}</div>
                <div className="text-sm text-gray-700 mb-1">Player Name: {order.playerName}</div>
                <div className="text-sm text-gray-700 mb-1">Player ID: {order.playerId}</div>
                <div className="text-sm text-gray-700 mb-1">Package Name: {order.packageName}</div>
                <div className="text-sm text-gray-700 mb-1">Total Price: {order.totalPrice}</div>
                <div className="text-sm text-gray-700 mb-1">Date: {order.date}</div>
                
                {/* Contact Information */}
                {order.email && (
                  <div className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Customer Email:</span> {order.email}
                  </div>
                )}
                
                {order.phone && (
                  <div className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Customer Phone:</span> {order.phone}
                    <a 
                      href={getDirectWhatsAppLink(order)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center text-green-600 hover:text-green-700"
                    >
                      <img src={waIcon} alt="WhatsApp" className="h-4 w-4" />
                      <span className="ml-1 text-xs">Chat</span>
                    </a>
                  </div>
                )}
                
          {/* Order Status */}
                <div className="text-sm text-gray-700 mb-1">
                  <span className="font-medium">Status:</span> 
                  <select 
                    value={order.status || "pending"}
                    onChange={(e) => handleStatusChange(order.orderId, e.target.value, order.status)}
                    className="ml-2 px-2 py-1 border rounded"
                  >
                    <option value="pending">Pending</option>
                    <option value="processing">Processing</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  {order.mongoDbId && (
                    <span className="ml-2 text-xs text-blue-500">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                      </svg>
                      Server synced
                    </span>
                  )}
                </div>
                
                {/* Email history */}
                {order.emailsSent && order.emailsSent.length > 0 && (
                  <div className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Emails Sent:</span> {order.emailsSent.length}
                    <ul className="text-xs ml-4">
                      {order.emailsSent.slice(0, 2).map((email, i) => (
                        <li key={i} className="italic">
                          {new Date(email.timestamp).toLocaleString()}: "{email.subject}"
                        </li>
                      ))}
                      {order.emailsSent.length > 2 && <li>...</li>}
                    </ul>
                  </div>
                )}
                
                {/* WhatsApp history */}
                {order.whatsappSent && order.whatsappSent.length > 0 && (
                  <div className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">WhatsApp Sent:</span> {order.whatsappSent.length}
                    <ul className="text-xs ml-4">
                      {order.whatsappSent.slice(0, 2).map((msg, i) => (
                        <li key={i} className="italic">
                          {new Date(msg.timestamp).toLocaleString()}
                        </li>
                      ))}
                      {order.whatsappSent.length > 2 && <li>...</li>}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="sm:ml-4 mt-4 sm:mt-0 flex flex-col gap-2">
                {order.email && (
                  <button
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm flex items-center justify-center"
                    onClick={() => openMessageModal(order, "email")}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Send Email
                  </button>
                )}
                
                {order.phone && (
                  <button
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm flex items-center justify-center"
                    onClick={() => openMessageModal(order, "whatsapp")}
                  >
                    <img src={waIcon} alt="WhatsApp" className="h-4 w-4 mr-1" />
                    Send WhatsApp
                  </button>
                )}
                
                {(order.receiptImage || order.recipt) && (
                  <button
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm flex items-center justify-center"
                    onClick={() => handleViewReceipt(order)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    View Receipt
                  </button>
                )}
                
                <button
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this order?')) {
                      // Update UI immediately
                      setOrders(orders.filter(o => (o.orderId) !== (order.orderId)));
                      
                      // Delete from server if authenticated
                      const token = localStorage.getItem("token");
                      if (token) {
                        axios.delete(`${getApiUrl("/api/order")}/${order.orderId}`, {
                          headers: {
                            Authorization: `Bearer ${token}`
                          }
                        })
                        .then(res => {
                          console.log("Order deleted from server:", res.data);
                        })
                        .catch(err => {
                          console.error("Error deleting order from server:", err);
                          setError("Failed to delete order from server. Please try again.");
                          setTimeout(() => setError(""), 3000);
                        });
                      }
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Message Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {messageType === "email" ? "Send Email to Customer" : "Send WhatsApp to Customer"}
              </h3>
              <button 
                onClick={() => setSelectedOrder(null)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <div className="flex mb-3">
                <button
                  onClick={() => setMessageType("email")}
                  className={`flex-1 py-2 flex items-center justify-center ${
                    messageType === "email" 
                      ? "bg-blue-100 border-b-2 border-blue-500 text-blue-700" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Email
                </button>
                <button
                  onClick={() => setMessageType("whatsapp")}
                  className={`flex-1 py-2 flex items-center justify-center ${
                    messageType === "whatsapp" 
                      ? "bg-green-100 border-b-2 border-green-500 text-green-700" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <img src={waIcon} alt="WhatsApp" className="h-5 w-5 mr-1" />
                  WhatsApp
                </button>
              </div>
              
              {messageType === "email" ? (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">To:</span> {selectedOrder.email || "No email available"}
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  <span className="font-medium">To:</span> {selectedOrder.phone || "No phone number available"}
                </p>
              )}
              
              <p className="text-sm text-gray-600">
                <span className="font-medium">Customer:</span> {selectedOrder.playerName || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Player ID:</span> {selectedOrder.playerId || 'N/A'}
              </p>
              <p className="text-sm text-gray-600">
                <span className="font-medium">Order:</span> {selectedOrder.orderNumber || selectedOrder.orderId}
              </p>
            </div>

            <form onSubmit={sendMessage}>
              {/* Subject field (only for email) */}
              {messageType === "email" && (
                <div className="mb-4">
                  <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700 mb-1">
                    Subject
                  </label>
                  <input
                    type="text"
                    id="emailSubject"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-2"
                    required
                  />
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="messageBody" className="block text-sm font-medium text-gray-700">
                    Message
                  </label>
                  <select 
                    className="text-xs border border-gray-300 rounded px-2 py-1"
                    onChange={(e) => {
                      if (e.target.value) {
                        const template = e.target.value
                          .replace("[PLAYER_NAME]", selectedOrder.playerName || "Customer")
                          .replace("[PLAYER_ID]", selectedOrder.playerId || "Unknown")
                          .replace("[ORDER_ID]", selectedOrder.orderNumber || selectedOrder.orderId)
                          .replace("[GAME]", selectedOrder.game || "your game")
                          .replace("[PACKAGE]", selectedOrder.packageName || "your package");
                        setMessageBody(template);
                      }
                    }}
                  >
                    <option value="">Select Template</option>
                    <option value="Dear [PLAYER_NAME],\n\nWe're following up on your order #[ORDER_ID].\n\nWe notice your Player ID is [PLAYER_ID]. Is this correct?\n\nThank you,\nSL Gaming Hub Team">Player ID Confirmation</option>
                    <option value="Dear [PLAYER_NAME],\n\nYour order #[ORDER_ID] has been completed and credited to your account with Player ID [PLAYER_ID].\n\nThank you for your purchase!\n\nSL Gaming Hub Team">Order Completion</option>
                    <option value="Dear [PLAYER_NAME],\n\nWe need additional information for your [GAME] order #[ORDER_ID].\n\nCould you please confirm your Player ID: [PLAYER_ID]?\n\nThank you,\nSL Gaming Hub Team">Request Player ID Confirmation</option>
                  </select>
                </div>
                <textarea
                  id="messageBody"
                  value={messageBody}
                  onChange={(e) => setMessageBody(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2 h-40"
                  required
                ></textarea>
                
                {messageType === "whatsapp" && (
                  <p className="mt-1 text-xs text-gray-500">
                    <strong>Tip:</strong> Use *asterisks* for bold text, _underscores_ for italic text
                  </p>
                )}
              </div>

              {messageStatus.message && (
                <div className={`mb-4 p-3 rounded ${messageStatus.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {messageStatus.message}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
                  disabled={sendingMessage}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 ${
                    messageType === "email" 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "bg-green-600 hover:bg-green-700"
                  } text-white rounded flex items-center`}
                  disabled={sendingMessage || 
                    (messageType === "email" && !selectedOrder.email) || 
                    (messageType === "whatsapp" && !selectedOrder.phone)}
                >
                  {sendingMessage ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : messageType === "email" ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Send Email
                    </>
                  ) : (
                    <>
                      <img src={waIcon} alt="WhatsApp" className="h-4 w-4 mr-1" />
                      Send WhatsApp
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt Image Modal */}
      {showReceiptModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">Bank Receipt</h3>
              <button 
                onClick={() => setShowReceiptModal(false)} 
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Add debug information during development */}
            {import.meta.env.DEV && (
              <div className="mb-4 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-20">
                <strong>Image URL:</strong> {receiptImage}
              </div>
            )}
            
            <div className="flex justify-center">
              {receiptImage ? (
                <div className="relative">
                  <img 
                    src={receiptImage} 
                    alt="Bank Receipt" 
                    className="max-w-full max-h-[70vh] object-contain"
                    onError={(e) => {
                      console.error("Failed to load image:", receiptImage);
                      e.target.onerror = null;
                      e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNNDAgNTBINjBNNTAgNDBWNjAiIHN0cm9rZT0iIzZCN0NCRCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=";
                      
                      // Try alternative URL format if the first one failed
                      const alternativeUrl = receiptImage.includes('/api/') 
                        ? receiptImage.replace('/api/', '/') 
                        : receiptImage.replace('/uploads/', '/api/uploads/');
                      
                      // If we have an alternative URL, try it
                      if (alternativeUrl !== receiptImage) {
                        console.log("Trying alternative URL:", alternativeUrl);
                        const newImg = new Image();
                        newImg.onload = () => {
                          console.log("Alternative URL worked, updating image");
                          e.target.src = alternativeUrl;
                        };
                        newImg.onerror = () => {
                          console.error("Alternative URL also failed");
                          alert("Error loading the receipt image. The image might be corrupted or unavailable.");
                        };
                        newImg.src = alternativeUrl;
                      } else {
                        alert("Error loading the receipt image. The image might be corrupted or unavailable.");
                      }
                    }}
                  />
                  <div className="absolute bottom-2 right-2 flex gap-2">
                    <a 
                      href={receiptImage} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full text-xs flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                      Open Original
                    </a>
                    <a 
                      href={receiptImage} 
                      download="bank-receipt.jpg"
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full text-xs flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Download
                    </a>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-10 border-2 border-dashed border-gray-300 rounded-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-gray-500">Receipt image could not be loaded</p>
                </div>
              )}
            </div>
            
            <div className="mt-4 flex justify-center space-x-3">
              <button
                onClick={() => setShowReceiptModal(false)}
                className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded"
              >
                Close
              </button>
              {receiptImage && (
                <a 
                  href={receiptImage}
                  download="receipt.jpg"
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded flex items-center"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
