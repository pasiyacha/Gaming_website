const { Router } = require('express');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Order = require('../model/orderModel');
const routeAuth = require('../middleware/routeAuth');

// Create a function to check if an image exists
function imageExists(imagePath) {
  try {
    // Remove the leading slash if present
    const normalizedPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
    const fullPath = path.join(__dirname, '..', normalizedPath);
    
    return fs.existsSync(fullPath);
  } catch (error) {
    console.error("Error checking if image exists:", error);
    return false;
  }
}

// Create a router for the receipt-related routes
const router = Router();

/**
 * GET /api/receipts/validate/:orderId
 * Validates if a receipt image exists for a given order
 */
router.get('/validate/:orderId', routeAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid Order ID format" 
      });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ 
        success: false, 
        message: "Order not found" 
      });
    }
    
    // Get the receipt path
    const receiptPath = order.recipt;
    
    if (!receiptPath) {
      return res.status(404).json({
        success: false,
        message: "This order has no receipt image"
      });
    }
    
    // Handle different receipt path formats
    if (receiptPath.startsWith('data:')) {
      // Data URL - always valid
      return res.status(200).json({
        success: true,
        imageUrl: receiptPath,
        format: "data-url"
      });
    } else if (receiptPath.startsWith('http')) {
      // External URL - assume it's valid
      return res.status(200).json({
        success: true,
        imageUrl: receiptPath,
        format: "external-url"
      });
    } else {
      // Local file path
      let fullPath = receiptPath;
      
      if (!fullPath.startsWith('/uploads/')) {
        fullPath = `/uploads/${receiptPath}`;
      }
      
      const exists = imageExists(fullPath);
      
      if (exists) {
        // Construct the full URL
        const baseUrl = process.env.API_URL || `http://${req.get('host')}`;
        const imageUrl = `${baseUrl}${fullPath}`;
        
        return res.status(200).json({
          success: true,
          imageUrl,
          format: "local-file"
        });
      } else {
        return res.status(404).json({
          success: false,
          message: "Receipt image file not found on server",
          path: fullPath
        });
      }
    }
  } catch (error) {
    console.error("Receipt validation error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error validating receipt",
      error: error.message
    });
  }
});

/**
 * GET /api/receipts/:orderId
 * Returns the receipt image for a given order
 */
router.get('/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).send("Invalid Order ID format");
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).send("Order not found");
    }
    
    // Get the receipt path
    const receiptPath = order.recipt;
    
    if (!receiptPath) {
      return res.status(404).send("This order has no receipt image");
    }
    
    // Handle different receipt path formats
    if (receiptPath.startsWith('data:')) {
      // Data URL - extract and send as image
      const matches = receiptPath.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      
      if (matches && matches.length === 3) {
        const contentType = matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');
        
        res.contentType(contentType);
        return res.send(buffer);
      } else {
        return res.status(400).send("Invalid data URL format");
      }
    } else if (receiptPath.startsWith('http')) {
      // External URL - redirect
      return res.redirect(receiptPath);
    } else {
      // Local file path
      let fullPath = receiptPath;
      
      if (!fullPath.startsWith('/uploads/')) {
        fullPath = `/uploads/${receiptPath}`;
      }
      
      // Remove the leading slash for the file system path
      const normalizedPath = fullPath.startsWith('/') ? fullPath.substring(1) : fullPath;
      const filePath = path.join(__dirname, '..', normalizedPath);
      
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      } else {
        return res.status(404).send("Receipt image file not found on server");
      }
    }
  } catch (error) {
    console.error("Error serving receipt:", error);
    return res.status(500).send("Server error retrieving receipt");
  }
});

module.exports = router;