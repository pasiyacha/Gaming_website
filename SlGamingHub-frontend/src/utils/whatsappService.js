/**
 * Mock WhatsApp messaging service for sending order notifications
 * In a real application, this would integrate with WhatsApp Business API
 */

/**
 * Simulates sending a WhatsApp message and stores it in localStorage for demo purposes
 * 
 * @param {Object} options - Message options
 * @param {string} options.to - Recipient phone number (with country code)
 * @param {string} options.message - Message text content
 * @returns {Promise} - Resolves with success message or rejects with error
 */
export const sendWhatsAppMessage = (options) => {
  return new Promise((resolve, reject) => {
    try {
      // Validate required fields
      if (!options.to || !options.message) {
        const error = new Error("Missing required WhatsApp fields (to, message)");
        console.error("WhatsApp validation failed:", error, options);
        throw error;
      }

      // Format phone number (remove spaces, ensure it has country code)
      const phoneNumber = formatPhoneNumber(options.to);
      
      // In a real app, this would call the WhatsApp Business API
      console.log("WHATSAPP DEBUG - Sending message to:", phoneNumber);
      console.log("WHATSAPP DEBUG - Message:", options.message.substring(0, 100) + "...");
      
      // Store message in localStorage for demo purposes
      try {
        const sentMessages = JSON.parse(localStorage.getItem("sentWhatsAppMessages") || "[]");
        sentMessages.push({
          to: phoneNumber,
          message: options.message,
          timestamp: new Date().toISOString(),
          status: "sent"
        });
        localStorage.setItem("sentWhatsAppMessages", JSON.stringify(sentMessages));
        console.log("WHATSAPP DEBUG - Saved to localStorage successfully");
      } catch (storageError) {
        console.error("WHATSAPP DEBUG - Failed to save to localStorage:", storageError);
        // Continue execution even if localStorage fails
      }
      
      // Simulate network delay
      setTimeout(() => {
        console.log("WHATSAPP DEBUG - WhatsApp message sent successfully to:", phoneNumber);
        resolve({ success: true, message: "WhatsApp message sent successfully" });
      }, 1000);
    } catch (error) {
      console.error("WhatsApp sending failed:", error);
      reject(error);
    }
  });
};

/**
 * Format phone number for WhatsApp
 * @param {string} phoneNumber - Phone number to format
 * @returns {string} - Formatted phone number
 */
const formatPhoneNumber = (phoneNumber) => {
  // Remove any non-digit characters
  let formatted = phoneNumber.replace(/\D/g, '');
  
  // Ensure it has country code (add Sri Lanka code if missing)
  if (formatted.length === 9) {
    // Assuming this is a Sri Lankan number without country code or leading zero
    formatted = '94' + formatted;
  } else if (formatted.length === 10 && formatted.startsWith('0')) {
    // Assuming this is a Sri Lankan number with leading zero
    formatted = '94' + formatted.substring(1);
  }
  
  return formatted;
};

/**
 * Sends an order confirmation WhatsApp message to the customer
 * 
 * @param {Object} orderDetails - Order details
 * @param {string} phoneNumber - Customer phone number
 * @returns {Promise}
 */
export const sendOrderConfirmationToCustomerWhatsApp = (orderDetails, phoneNumber) => {
  console.log("WHATSAPP DEBUG - sendOrderConfirmationToCustomer called with phone:", phoneNumber);
  
  if (!phoneNumber) {
    console.error("WHATSAPP DEBUG - Customer phone is required but was not provided");
    return Promise.reject(new Error("Customer phone number is required"));
  }
  
  // Create WhatsApp message content with full order details
  const message = `
*SL GAMING HUB - ORDER DETAILS*

Dear ${orderDetails.username || orderDetails.playerName || 'Customer'},

Thank you for your order with SL Gaming Hub. Here are your complete order details:

*ORDER INFORMATION*
📋 Order Number: ${orderDetails.orderNumber || orderDetails.orderId || 'New Order'}
📆 Order Date: ${new Date().toLocaleString()}
✅ Status: Order Processed

*GAME DETAILS*
🎮 Game: ${orderDetails.gameName || orderDetails.game || ''}
🆔 Game ID: ${orderDetails.userId || ''}
👤 Username: ${orderDetails.username || orderDetails.playerName || ''}

*PURCHASE DETAILS*
📦 Package: ${orderDetails.packageName || ''}
${orderDetails.packageDescription ? `� Description: ${orderDetails.packageDescription}\n` : ''}
�💰 Amount: ${orderDetails.packagePrice || orderDetails.totalPrice || ''}
💳 Payment Method: Bank Transfer
✅ Payment Status: Received

*DELIVERY INFORMATION*
📱 Your recharge has been processed
⏱️ Credited to your game account
📅 Processing Date: ${new Date().toLocaleString()}

*CONTACT SUPPORT*
If you have any questions about your order or need further assistance, please contact our support team:
📱 WhatsApp: +94771234567
⏰ Support Hours: 9 AM - 9 PM, 7 days a week

Thank you for choosing SL Gaming Hub for your gaming needs!
  `;
  
  console.log("WHATSAPP DEBUG - Prepared customer WhatsApp message to:", phoneNumber);
  
  return sendWhatsAppMessage({
    to: phoneNumber,
    message
  });
};

/**
 * Sends an order notification WhatsApp message to the admin
 * 
 * @param {Object} orderDetails - Order details
 * @returns {Promise}
 */
export const sendOrderNotificationToAdminWhatsApp = (orderDetails) => {
  console.log("WHATSAPP DEBUG - sendOrderNotificationToAdmin called");
  
  // In a real app, you would have this phone number in your environment variables
  const adminPhone = "+94771234567"; // Replace with your actual admin phone number
  
  // Create WhatsApp message content with full order details
  const message = `
*SL GAMING HUB - NEW ORDER ALERT*

A new order has been received and requires processing.

*ORDER INFORMATION*
📋 Order Number: ${orderDetails.orderNumber || orderDetails.orderId || 'New Order'}
📆 Order Date: ${new Date().toLocaleString()}
⏳ Status: Payment Received - Awaiting Processing

*CUSTOMER INFORMATION*
👤 Customer Name: ${orderDetails.username || orderDetails.playerName || 'Not provided'}
� WhatsApp: ${orderDetails.phone || 'Not provided'}
🆔 Game ID: ${orderDetails.userId || 'Not provided'}

*PURCHASE DETAILS*
🎮 Game: ${orderDetails.gameName || orderDetails.game || ''}
📦 Package: ${orderDetails.packageName || ''}
${orderDetails.packageDescription ? `📝 Description: ${orderDetails.packageDescription}\n` : ''}
� Amount: ${orderDetails.packagePrice || orderDetails.totalPrice || ''}
💳 Payment Method: Bank Transfer
✅ Payment Status: Received

*REQUIRED ACTIONS*
1. Verify payment details
2. Process the order in the game system
3. Update order status in dashboard
4. Mark as completed when done

Please login to the admin dashboard to process this order:
🌐 Admin URL: http://16.170.236.106/admin/orders

IMPORTANT: This order requires immediate attention.
  `;
  
  console.log("WHATSAPP DEBUG - Prepared admin WhatsApp message to:", adminPhone);
  
  return sendWhatsAppMessage({
    to: adminPhone,
    message
  });
};

/**
 * Gets a WhatsApp deep link that will open WhatsApp with a pre-filled message
 * 
 * @param {string} phoneNumber - Phone number to message
 * @param {string} message - Pre-filled message
 * @returns {string} - WhatsApp deep link URL
 */
export const getWhatsAppLink = (phoneNumber, message = '') => {
  const formattedPhone = formatPhoneNumber(phoneNumber);
  const encodedMessage = encodeURIComponent(message);
  return `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
};
