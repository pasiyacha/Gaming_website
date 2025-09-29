const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Order = require("../model/orderModel");
const Package = require("../model/packageModel");
const { User } = require("../model/userModel");
const sendEmail = require("../utils/sendEmail");
const { processImage } = require("../middleware/upload");
const { sendCompletionNotification } = require("../utils/backupNotification");

// Create Order
async function createOrder(req, res) {
  try {
    const { userId, playerName, playerId, packageId, totalPrice, quantity } = req.body;

    // Validate required fields
    if (!userId || !playerName || !playerId || !packageId || !totalPrice) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid User ID" });
    }

    if (!mongoose.Types.ObjectId.isValid(packageId)) {
      return res.status(400).json({ message: "Invalid Package ID" });
    }

    // For receipt handling through form data upload
    let imageUrl = null;
    try {
      if (req.file) {
        // Process the uploaded image if exists
        imageUrl = await processImage(req.file, req);
      } else if (req.body.recipt) {
        // Use the receipt URL provided in the request body (if file not uploaded)
        imageUrl = req.body.recipt;
      } else {
        return res.status(400).json({ message: "Receipt image is required" });
      }
    } catch (imgError) {
      console.error("Image processing error:", imgError);
      return res.status(400).json({ message: `Image processing failed: ${imgError.message}` });
    }
    
    // Validate imageUrl
    if (!imageUrl || imageUrl === "http://localhost:5000/uploads/undefined") {
      return res.status(400).json({ message: "Valid receipt image is required" });
    }

    // Package එක ගන්න
    const selectedPackage = await Package.findById(packageId);
    if (!selectedPackage) {
      return res.status(404).json({ message: "Package not found" });
    }

    // User එක check කරන්න
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "User email not verified" });
    }
    if (!user.isActive) {
      return res.status(403).json({ message: "User account is not active" });
    }

    // We've already processed the image above, no need to do it again

    // Order create
    const newOrder = new Order({
      userId,
      playerName,
      playerId,
      packageId,
      quantity: 1, // Always set to 1
      totalPrice: parseFloat(totalPrice) || 0, // Convert to float
      recipt: imageUrl,
    });

    const savedOrder = await newOrder.save();

    // Email send
    const orderDate = savedOrder.date.toLocaleString();
    const customerEmail = user.email;
    const adminEmail = process.env.SMTP_USER;

    const subject = `Order Confirmation - Order #${savedOrder._id}`;

    const customerText = `Dear ${playerName},

Thank you for your order! We're excited to confirm your purchase.

Order Details:
• Order ID: ${savedOrder._id}
• Player ID: ${playerId}
• Player Name: ${playerName}
• Date: ${orderDate}
• Status: ${savedOrder.status}
• Total Price: $${Number(totalPrice).toFixed(2)}
• Receipt: ${imageUrl}

Best regards,
SL Gaming Hub Team`;

    const adminText = `New Order Received!

Order Details:
• Order ID: ${savedOrder._id}
• Player ID: ${playerId}
• Player Name: ${playerName}
• Date: ${orderDate}
• Total Price: $${Number(totalPrice).toFixed(2)}
• Status: ${savedOrder.status}
• Receipt: ${imageUrl}

Please process this order promptly.

Thank you,
SL Gaming Hub System`;

    try {
      // Send emails but don't wait for them to complete before responding to client
      Promise.all([
        sendEmail(customerEmail, subject, customerText),
        sendEmail(adminEmail, `New Order Received - Order #${savedOrder._id}`, adminText),
      ]).catch(emailError => {
        console.error("Non-critical email sending error:", emailError);
        // Don't throw - this shouldn't block the order creation
      });
      
      // Return success response immediately without waiting for emails
      res.status(201).json(savedOrder);
    } catch (finalError) {
      // This catch is just a safety net - shouldn't happen since we already catch email errors above
      console.error("Unexpected error in email sending:", finalError);
      res.status(201).json(savedOrder);
    }
  } catch (err) {
    console.error("Order creation error:", err);
    let statusCode = 400;
    let errorMessage = err.message || "Unknown server error";

    // Handle specific MongoDB error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = Object.values(err.errors).map(val => val.message).join(', ');
    } else if (err.code === 11000) {
      statusCode = 400;
      errorMessage = `Duplicate key error: ${JSON.stringify(err.keyValue)}`;
    } else if (err.name === 'MongoServerError') {
      statusCode = 500;
      errorMessage = `Database error: ${err.message}`;
    } else if (err.name === 'MongoNetworkError') {
      statusCode = 503;
      errorMessage = 'Unable to connect to database, please try again later';
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      errorType: err.name,
      errorCode: err.code
    });
  }
}

// Get all orders
async function getAllOrders(req, res) {
  try {
    // Get orders with populated user and package data
    const orders = await Order.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'email phone')  // Populate user info with just email and phone
      .populate({
        path: 'packageId',
        select: 'packagename price gameId', // Use packagename instead of name
        populate: {
          path: 'gameId',
          select: 'gamename' // Get the game name from the gameId reference
        }
      });
    
    res.status(200).json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Get single order
async function getOrderById(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }

    const order = await Order.findById(id)
      .populate('userId', 'email phone')
      .populate({
        path: 'packageId',
        select: 'packagename price gameId',
        populate: {
          path: 'gameId',
          select: 'gamename'
        }
      });
      
    if (!order) return res.status(404).json({ message: "Order not found" });

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Update order
async function updateOrder(req, res) {
  try {
    const { packageId, playerName, playerId, totalPrice, status } = req.body;
    const orderId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }

    const existingOrder = await Order.findById(orderId);
    if (!existingOrder) return res.status(404).json({ message: "Order not found" });

    // Initialize the updated data object with existing values
    const updatedData = {
      playerName: playerName || existingOrder.playerName,
      playerId: playerId || existingOrder.playerId,
      totalPrice: totalPrice || existingOrder.totalPrice,
      status: status || existingOrder.status
    };
    
    // Update package ID if provided
    let finalPackageId = existingOrder.packageId;
    if (packageId) {
      if (!mongoose.Types.ObjectId.isValid(packageId)) {
        return res.status(400).json({ message: "Invalid Package ID" });
      }
      finalPackageId = packageId;
      updatedData.packageId = finalPackageId;
    }

    const selectedPackage = await Package.findById(finalPackageId);
    if (!selectedPackage) return res.status(404).json({ message: "Package not found" });

    // Receipt update
    if (req.file) {
      try {
        // Process the uploaded image if exists
        const imageUrl = await processImage(req.file, req);
        
        // Try to delete old image if it exists
        if (existingOrder.recipt) {
          try {
            const hostPart = req.get("host") || process.env.API_HOST || "localhost:5000";
            const protocol = req.protocol || "http";
            const baseUrl = `${protocol}://${hostPart}`;
            
            // Check if the receipt URL contains our host
            if (existingOrder.recipt.includes(baseUrl)) {
              // Extract the path portion after the host
              const relativePath = existingOrder.recipt.split(baseUrl)[1];
              if (relativePath) {
                const oldImagePath = path.join(__dirname, "..", relativePath);
                if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
              }
            }
          } catch (deleteErr) {
            console.error("Error deleting old image:", deleteErr);
            // Continue even if delete fails
          }
        }

        updatedData.recipt = imageUrl;
      } catch (imgError) {
        console.error("Image processing error:", imgError);
        return res.status(400).json({ message: `Image processing failed: ${imgError.message}` });
      }
    }

    const updatedOrder = await Order.findByIdAndUpdate(orderId, updatedData, { new: true, runValidators: true });

    if (!updatedOrder) return res.status(404).json({ message: "Order not found" });

    // Email notify
    const user = await User.findById(updatedOrder.userId);
    if (user) {
      const customerEmail = user.email;
      const adminEmail = process.env.SMTP_USER;
      const orderDate = updatedOrder.date.toLocaleString();

      const subject = `Order Updated - Order #${updatedOrder._id}`;
      const customerText = `Dear ${updatedOrder.playerName},

Your order has been updated.

Order Details:
• Order ID: ${updatedOrder._id}
• Player ID: ${updatedOrder.playerId}
• Player Name: ${updatedOrder.playerName}
• Date: ${orderDate}
• Status: ${updatedOrder.status}
• Total Price: $${updatedOrder.totalPrice.toFixed(2)}
• Receipt: ${updatedOrder.recipt}

Best regards,
SL Gaming Hub Team`;

      const adminText = `Order Updated!

Order Details:
• Order ID: ${updatedOrder._id}
• Player ID: ${updatedOrder.playerId}
• Player Name: ${updatedOrder.playerName}
• Date: ${orderDate}
• Total Price: $${updatedOrder.totalPrice.toFixed(2)}
• Status: ${updatedOrder.status}
• Receipt: ${updatedOrder.recipt}

Please check and process this order.`;

      // Send emails but don't wait for them to complete before responding to client
      Promise.all([
        sendEmail(customerEmail, subject, customerText),
        sendEmail(adminEmail, `Order Updated - #${updatedOrder._id}`, adminText),
      ]).catch(emailError => {
        console.error("Non-critical email sending error in updateOrder:", emailError);
        // Don't throw - this shouldn't block the order update
      });
    }

    // Return response immediately without waiting for emails
    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error("Update Order Error:", err);
    let statusCode = 400;
    let errorMessage = err.message || "Unknown server error";

    // Handle specific MongoDB error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = Object.values(err.errors).map(val => val.message).join(', ');
    } else if (err.code === 11000) {
      statusCode = 400;
      errorMessage = `Duplicate key error: ${JSON.stringify(err.keyValue)}`;
    } else if (err.name === 'MongoServerError') {
      statusCode = 500;
      errorMessage = `Database error: ${err.message}`;
    } else if (err.name === 'MongoNetworkError') {
      statusCode = 503;
      errorMessage = 'Unable to connect to database, please try again later';
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      errorType: err.name,
      errorCode: err.code
    });
  }
}

// Delete order
async function deleteOrder(req, res) {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }

    const deletedOrder = await Order.findByIdAndDelete(id);
    if (!deletedOrder) return res.status(404).json({ message: "Order not found" });

    // Optionally delete receipt image
    if (deletedOrder.recipt) {
      const oldImagePath = path.join(__dirname, "..", deletedOrder.recipt.split(`${req.get("host")}/`)[1]);
      if (fs.existsSync(oldImagePath)) fs.unlinkSync(oldImagePath);
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function setOrderStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Order ID" });
    }

    // First, get the current order to check the original status
    const existingOrder = await Order.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Only proceed with update if the status is actually changing
    if (existingOrder.status === status) {
      return res.status(200).json({ message: "Status unchanged", order: existingOrder });
    }

    // Update the order status
    const updatedOrder = await Order.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    )
    .populate('userId', 'email name')
    .populate({
      path: 'packageId',
      select: 'packagename price gameId',
      populate: {
        path: 'gameId',
        select: 'gamename'
      }
    });

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found after update" });
    }

    // If status is changed to "completed", send an email to the user
    if (status === "completed") {
      try {
        const user = updatedOrder.userId;
        const packageInfo = updatedOrder.packageId;
        const gameInfo = packageInfo?.gameId;
        
        if (user && user.email) {
          const customerEmail = user.email;
          // Use dedicated admin notification email if available, fall back to SMTP_USER if not
          const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@slgaminghub.com';
          const orderDate = updatedOrder.date.toLocaleString();
          
          const subject = `Your Order Has Been Completed - Order #${updatedOrder._id}`;
          const customerText = `Dear ${updatedOrder.playerName},

Great news! Your order has been completed and processed successfully.

Order Details:
• Order ID: ${updatedOrder._id}
• Player ID: ${updatedOrder.playerId}
• Player Name: ${updatedOrder.playerName}
• Game: ${gameInfo?.gamename || "Game"}
• Package: ${packageInfo?.packagename || "Package"}
• Date: ${orderDate}
• Status: Completed
• Total Price: $${updatedOrder.totalPrice.toFixed(2)}

Your account has been credited with the purchased items. Thank you for your business!

If you have any questions or need further assistance, please don't hesitate to contact us.

Best regards,
SL Gaming Hub Team`;

          const adminText = `Order #${updatedOrder._id} has been marked as completed.

Order Details:
• Order ID: ${updatedOrder._id}
• Player ID: ${updatedOrder.playerId}
• Player Name: ${updatedOrder.playerName}
• Game: ${gameInfo?.gamename || "Game"}
• Package: ${packageInfo?.packagename || "Package"}
• Date: ${orderDate}
• Total Price: $${updatedOrder.totalPrice.toFixed(2)}
• Status: Completed

The order has been successfully processed.`;

          // Try to send both customer and admin emails
          // For each email, log success or failure but don't block the order completion
          try {
            // Send customer email
            const customerResult = await sendEmail(customerEmail, subject, customerText);
            if (customerResult.success) {
              console.log(`Customer email sent successfully for order ${updatedOrder._id}`);
            } else {
              console.warn(`Failed to send customer email for order ${updatedOrder._id}: ${customerResult.reason}`);
              
              // If customer email fails but we have admin email, notify admin about the failure
              if (adminEmail !== customerEmail) {
                sendEmail(
                  adminEmail,
                  `ATTENTION: Failed to send email to customer - Order #${updatedOrder._id}`,
                  `Warning: The system failed to send a completion email to the customer (${customerEmail}) for order ${updatedOrder._id}.\n\nError: ${customerResult.reason}\n\nPlease contact the customer manually to inform them their order has been completed.\n\nOrder Details:\n• Player: ${updatedOrder.playerName}\n• Player ID: ${updatedOrder.playerId}`
                ).catch(err => console.error("Failed to send customer email failure notification to admin:", err));
              }
            }
            
            // Send admin email
            const adminResult = await sendEmail(adminEmail, `Order Completed - #${updatedOrder._id}`, adminText);
            if (adminResult.success) {
              console.log(`Admin notification email sent successfully for order ${updatedOrder._id}`);
            } else {
              console.warn(`Failed to send admin email for order ${updatedOrder._id}: ${adminResult.reason}`);
            }
            
            // Record this in the database or log that emails were attempted
            console.log(`Completion emails processed for order ${updatedOrder._id}`);
          } catch (emailError) {
            console.error(`Error handling emails for completed order ${updatedOrder._id}:`, emailError);
            
            // If primary email system fails, use backup notification system
            try {
              console.log(`Attempting to use backup notification system for order ${updatedOrder._id}`);
              const orderSummary = {
                orderId: updatedOrder._id,
                playerName: updatedOrder.playerName,
                playerId: updatedOrder.playerId,
                game: gameInfo?.gamename || "Unknown Game",
                package: packageInfo?.packagename || "Unknown Package",
                price: updatedOrder.totalPrice,
                date: orderDate
              };
              
              // Send backup notification to admin
              const backupResult = await sendCompletionNotification(
                adminEmail,
                updatedOrder._id,
                orderSummary
              );
              
              console.log(`Backup notification system results for order ${updatedOrder._id}:`, backupResult);
            } catch (backupError) {
              console.error(`Backup notification system also failed for order ${updatedOrder._id}:`, backupError);
            }
          }
        } else {
          console.warn(`Cannot send completion email: No email found for user with order ${updatedOrder._id}`);
        }
      } catch (emailError) {
        console.error("Error sending completion email:", emailError);
        // Continue with the response even if email fails
      }
    }

    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error("Update status error:", err);
    let statusCode = 500;
    let errorMessage = err.message || "Unknown server error";

    // Handle specific MongoDB error types
    if (err.name === 'ValidationError') {
      statusCode = 400;
      errorMessage = Object.values(err.errors).map(val => val.message).join(', ');
    } else if (err.code === 11000) {
      statusCode = 400;
      errorMessage = `Duplicate key error: ${JSON.stringify(err.keyValue)}`;
    } else if (err.name === 'MongoServerError') {
      statusCode = 500;
      errorMessage = `Database error: ${err.message}`;
    } else if (err.name === 'MongoNetworkError') {
      statusCode = 503;
      errorMessage = 'Unable to connect to database, please try again later';
    } else if (err.name === 'CastError') {
      statusCode = 400;
      errorMessage = `Invalid ${err.path}: ${err.value}`;
    }

    res.status(statusCode).json({ 
      error: errorMessage,
      errorType: err.name,
      errorCode: err.code
    });
  }
}

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrder,
  deleteOrder,
  setOrderStatus
};
