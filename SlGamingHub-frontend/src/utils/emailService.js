// Mock email service for sending order confirmations

/**
 * Simulates sending an email and stores the email in localStorage for demo purposes
 * In a real application, this would make an API call to a backend service
 * 
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.body - Email body (HTML supported)
 * @param {string} options.from - Sender email (optional)
 * @returns {Promise} - Resolves with success message or rejects with error
 */
export const sendEmail = (options) => {
  return new Promise((resolve, reject) => {
    try {
      // Validate required fields
      if (!options.to || !options.subject || !options.body) {
        const error = new Error("Missing required email fields (to, subject, body)");
        console.error("Email validation failed:", error, options);
        throw error;
      }

      // In a real app, this would be an API call to your email service
      console.log("EMAIL DEBUG - Sending email to:", options.to);
      console.log("EMAIL DEBUG - Subject:", options.subject);
      console.log("EMAIL DEBUG - Body length:", options.body.length, "characters");
      
      // Store email in localStorage for demo purposes
      try {
        const sentEmails = JSON.parse(localStorage.getItem("sentEmails") || "[]");
        sentEmails.push({
          to: options.to,
          subject: options.subject,
          from: options.from || "system@16.170.236.106",
          timestamp: new Date().toISOString(),
          status: "sent"
        });
        localStorage.setItem("sentEmails", JSON.stringify(sentEmails));
        console.log("EMAIL DEBUG - Saved to localStorage successfully");
      } catch (storageError) {
        console.error("EMAIL DEBUG - Failed to save to localStorage:", storageError);
        // Continue execution even if localStorage fails
      }
      
      // Simulate network delay
      setTimeout(() => {
        console.log("EMAIL DEBUG - Email sent successfully to:", options.to);
        resolve({ success: true, message: "Email sent successfully" });
      }, 1000);
    } catch (error) {
      console.error("Email sending failed:", error);
      reject(error);
    }
  });
};

/**
 * Sends an order confirmation email to the customer
 * 
 * @param {Object} orderDetails - Order details
 * @param {string} userEmail - Customer email address
 * @returns {Promise}
 */
export const sendOrderConfirmationToCustomer = (orderDetails, userEmail) => {
  console.log("EMAIL DEBUG - sendOrderConfirmationToCustomer called with email:", userEmail);
  console.log("EMAIL DEBUG - Order details:", JSON.stringify(orderDetails));
  
  if (!userEmail) {
    console.error("EMAIL DEBUG - Customer email is required but was not provided");
    return Promise.reject(new Error("Customer email is required"));
  }
  
  // Create email content
  const subject = `Order Confirmation - ${orderDetails.orderNumber || 'New Order'}`;
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0e08ab; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">Order Confirmation</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #ddd; background-color: #f9f9f9;">
        <p>Dear ${orderDetails.username || orderDetails.playerName || 'Customer'},</p>
        
        <p>Thank you for your order! We've received your payment and are processing your request.</p>
        
        <div style="background-color: #fff; border: 1px solid #eee; padding: 15px; margin: 15px 0;">
          <h2 style="margin-top: 0; color: #0e08ab;">Order Summary</h2>
          <p><strong>Order Number:</strong> ${orderDetails.orderNumber || orderDetails.orderId || 'New Order'}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Game:</strong> ${orderDetails.gameName || orderDetails.game || ''}</p>
          <p><strong>Package:</strong> ${orderDetails.packageName || ''}</p>
          <p><strong>Amount:</strong> ${orderDetails.packagePrice || orderDetails.totalPrice || ''}</p>
          <p><strong>Game ID:</strong> ${orderDetails.userId || ''}</p>
          <p><strong>Username:</strong> ${orderDetails.username || orderDetails.playerName || ''}</p>
          <p><strong>Status:</strong> <span style="color: green; font-weight: bold;">Confirmed</span></p>
        </div>
        
        <p>Your purchase will be credited to your account within 24 hours. If you have any questions, please contact our support team.</p>
        
        <p>Best regards,<br>SL Gaming Hub Team</p>
      </div>
      
      <div style="padding: 20px; text-align: center; font-size: 12px; color: #777;">
        <p>This is an automated email, please do not reply.</p>
        <p>&copy; ${new Date().getFullYear()} SL Gaming Hub. All rights reserved.</p>
      </div>
    </div>
  `;
  
  console.log("EMAIL DEBUG - Prepared customer email to:", userEmail);
  return sendEmail({
    to: userEmail,
    subject,
    body,
    from: "noreply@16.170.236.106"
  });
};

/**
 * Sends an order notification email to the admin
 * 
 * @param {Object} orderDetails - Order details
 * @returns {Promise}
 */
export const sendOrderNotificationToAdmin = (orderDetails) => {
  console.log("EMAIL DEBUG - sendOrderNotificationToAdmin called");
  console.log("EMAIL DEBUG - Order details:", JSON.stringify(orderDetails));
  
  // In a real app, you would have this email address in your environment variables
  const adminEmail = "admin@16.170.236.106";
  
  // Create email content
  const subject = `New Order Received - ${orderDetails.orderNumber || orderDetails.orderId || 'New Order'}`;
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #0e08ab; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0;">New Order Received</h1>
      </div>
      
      <div style="padding: 20px; border: 1px solid #ddd; background-color: #f9f9f9;">
        <p>A new order has been received and is ready for processing:</p>
        
        <div style="background-color: #fff; border: 1px solid #eee; padding: 15px; margin: 15px 0;">
          <h2 style="margin-top: 0; color: #0e08ab;">Order Details</h2>
          <p><strong>Order Number:</strong> ${orderDetails.orderNumber || orderDetails.orderId || 'New Order'}</p>
          <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Game:</strong> ${orderDetails.gameName || orderDetails.game || ''}</p>
          <p><strong>Package:</strong> ${orderDetails.packageName || ''}</p>
          <p><strong>Amount:</strong> ${orderDetails.packagePrice || orderDetails.totalPrice || ''}</p>
          <p><strong>Game ID:</strong> ${orderDetails.userId || ''}</p>
          <p><strong>Username:</strong> ${orderDetails.username || orderDetails.playerName || ''}</p>
          
          ${orderDetails.receiptImage ? `<p><strong>Payment Receipt:</strong> Uploaded</p>` : ''}
          
          <p><strong>Customer Email:</strong> ${orderDetails.email || 'Not provided'}</p>
          <p><strong>Status:</strong> <span style="color: orange; font-weight: bold;">Pending</span></p>
        </div>
        
        <p>Please log in to the admin dashboard to process this order.</p>
      </div>
      
      <div style="padding: 20px; text-align: center; font-size: 12px; color: #777;">
        <p>This is an automated notification from the SL Gaming Hub system.</p>
        <p>&copy; ${new Date().getFullYear()} SL Gaming Hub. All rights reserved.</p>
      </div>
    </div>
  `;
  
  console.log("EMAIL DEBUG - Prepared admin email to:", adminEmail);
  return sendEmail({
    to: adminEmail,
    subject,
    body,
    from: "system@16.170.236.106"
  });
};
