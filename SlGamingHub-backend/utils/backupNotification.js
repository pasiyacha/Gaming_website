/**
 * Backup notification system that can be used when the primary email system fails
 * This provides alternative ways to ensure notifications are delivered
 */

const fs = require('fs');
const path = require('path');
const axios = require('axios');

// Directory for storing notification logs
const NOTIFICATION_DIR = path.join(__dirname, '..', 'logs', 'notifications');

// Initialize the notification directory if it doesn't exist
function initNotificationDir() {
  if (!fs.existsSync(NOTIFICATION_DIR)) {
    try {
      fs.mkdirSync(NOTIFICATION_DIR, { recursive: true });
      console.log("Created notification logs directory");
    } catch (err) {
      console.error("Failed to create notification logs directory:", err);
    }
  }
}

// Write notification to a log file as a backup
async function logNotification(type, recipient, subject, message, orderId) {
  try {
    initNotificationDir();
    
    const timestamp = new Date().toISOString();
    const filename = `${timestamp}-${type}-${orderId || 'unknown'}.txt`;
    const filePath = path.join(NOTIFICATION_DIR, filename);
    
    const content = `
Type: ${type}
Time: ${timestamp}
Recipient: ${recipient}
Subject: ${subject}
Order ID: ${orderId || 'N/A'}
Message:
${message}
`;

    fs.writeFileSync(filePath, content);
    console.log(`Notification logged to ${filePath}`);
    return true;
  } catch (err) {
    console.error("Failed to log notification:", err);
    return false;
  }
}

// Send notification via webhook (if configured)
async function sendWebhookNotification(title, message, orderId) {
  try {
    const webhookUrl = process.env.NOTIFICATION_WEBHOOK;
    if (!webhookUrl) {
      return { success: false, reason: "Webhook URL not configured" };
    }
    
    const payload = {
      title: title,
      message: message,
      orderId: orderId,
      timestamp: new Date().toISOString()
    };
    
    const response = await axios.post(webhookUrl, payload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (response.status >= 200 && response.status < 300) {
      return { success: true };
    } else {
      return { success: false, reason: `Webhook returned status ${response.status}` };
    }
  } catch (err) {
    console.error("Failed to send webhook notification:", err);
    return { success: false, reason: err.message };
  }
}

// Fallback notification system - tries multiple methods to ensure notification is delivered
async function sendCompletionNotification(recipient, orderId, orderDetails) {
  const subject = `Order Completed - #${orderId}`;
  const message = `
Order #${orderId} has been marked as completed.

Order Details:
${JSON.stringify(orderDetails, null, 2)}

This is an automated notification.
`;

  const results = {
    logged: false,
    webhook: false
  };
  
  // Log the notification to a file
  results.logged = await logNotification('order_completed', recipient, subject, message, orderId);
  
  // Try webhook if available
  const webhookResult = await sendWebhookNotification(subject, message, orderId);
  results.webhook = webhookResult.success;
  
  return results;
}

module.exports = {
  sendCompletionNotification,
  logNotification
};