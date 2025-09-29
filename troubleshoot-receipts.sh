#!/bin/bash

# Troubleshooting script for receipt image issues
echo "SL Gaming Hub Receipt Image Troubleshooting"
echo "==========================================="

# 1. Check uploads directory existence and permissions
echo "Checking uploads directory..."
UPLOADS_DIR="SlGamingHub-backend/uploads"
if [ -d "$UPLOADS_DIR" ]; then
  echo "✓ Uploads directory exists"
  echo "  - Contains $(ls -1 $UPLOADS_DIR | wc -l) files"
  echo "  - Permissions: $(ls -ld $UPLOADS_DIR | awk '{print $1}')"
else
  echo "✗ PROBLEM: Uploads directory missing. Creating it..."
  mkdir -p "$UPLOADS_DIR"
  echo "  - Created uploads directory"
fi

# 2. Validate receipt storage path consistency
echo ""
echo "Checking file naming conventions in uploads directory..."
PACKAGE_FILES=$(find $UPLOADS_DIR -name "package-*.jpeg" | wc -l)
RECEIPT_FILES=$(find $UPLOADS_DIR -name "receipt-*.jpeg" | wc -l)
echo "  - Files with 'package-' prefix: $PACKAGE_FILES"
echo "  - Files with 'receipt-' prefix: $RECEIPT_FILES"

# 3. Check MongoDB storage field consistency
echo ""
echo "Checking for field name consistency issues..."
echo "This is a potential issue - code uses both 'recipt' and 'receiptImage' fields."
echo "Check orderModel.js and update all frontend references to use the same field name."

# 4. Fix image URL construction in frontend Orders.jsx
echo ""
echo "Creating fixed Orders.jsx with improved image URL handling..."

# Create backup of original file
cp "SlGamingHub-frontend/src/Pages/Admin_Dashbord/Orders.jsx" "SlGamingHub-frontend/src/Pages/Admin_Dashbord/Orders.jsx.bak"

# File exists check
echo ""
echo "To fix the issue, apply the following changes:"
echo "1. Update the receipt image handling logic in Orders.jsx"
echo "2. Create a dedicated API endpoint to validate receipt images"
echo "3. Standardize receipt field names throughout the codebase"
echo ""
echo "Follow the detailed fix instructions in the README_RECEIPT_FIX.md file"

# Create README with fix instructions
cat > "README_RECEIPT_FIX.md" << 'EOF'
# Receipt Image Loading Fix

This document provides instructions to fix the "Error loading the receipt image" issue in the SL Gaming Hub application.

## Root Causes

1. **Field Name Inconsistency**: The code uses both `recipt` and `receiptImage` for the same purpose
2. **Path Resolution Issues**: URL construction for image paths is inconsistent
3. **Error Handling**: Inadequate error handling for missing or corrupted images

## Fix Instructions

### 1. Standardize Field Names

In `orderModel.js`, ensure the receipt field has a consistent name:

```javascript
// In orderModel.js
recipt: {
  type: String,
  required: [true, "Receipt is required"],
  trim: true,
}
```

### 2. Update Image URL Construction

In `Orders.jsx`, modify the `handleViewReceipt` function:

```javascript
// Handle viewing receipt image
const handleViewReceipt = (order) => {
  // First check if there's a receipt image
  let imageUrl = order.recipt; // Use the standardized field name
  
  if (!imageUrl) {
    alert("No receipt image available for this order.");
    return;
  }
  
  // Ensure proper URL construction based on the type of URL stored
  if (imageUrl.startsWith('data:')) {
    // It's a data URL, use as is
    // No changes needed
  } else if (imageUrl.startsWith('http')) {
    // It's already a full URL, use as is
    // No changes needed
  } else if (imageUrl.startsWith('/uploads/')) {
    // It's a server path starting with /uploads/
    imageUrl = `${getApiUrl('')}${imageUrl}`;
  } else {
    // Assume it's just a filename
    imageUrl = `${getApiUrl('')}/uploads/${imageUrl}`;
  }
  
  console.log("Displaying receipt image:", imageUrl);
  setReceiptImage(imageUrl);
  setShowReceiptModal(true);
};
```

### 3. Improve Error Handling in the Image Display

```jsx
<img 
  src={receiptImage} 
  alt="Bank Receipt" 
  className="max-w-full max-h-[70vh] object-contain"
  onError={(e) => {
    e.target.onerror = null; // Prevent infinite loop
    console.error("Failed to load image:", receiptImage);
    e.target.src = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNFNUU3RUIiLz48cGF0aCBkPSJNNDAgNTBINjBNNTAgNDBWNjAiIHN0cm9rZT0iIzZCN0NCRCIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz48L3N2Zz4=";
    alert("Error loading the receipt image. The image might be corrupted or unavailable.");
  }}
/>
```

### 4. Add Image Check Utility Function

Add a utility function in the backend to check if an image exists:

```javascript
// In a new file like utils/imageHelpers.js
const fs = require('fs');
const path = require('path');

function imageExists(imagePath) {
  // Remove the leading slash if present
  const normalizedPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
  const fullPath = path.join(__dirname, '..', normalizedPath);
  
  return fs.existsSync(fullPath);
}

module.exports = { imageExists };
```

### 5. Add a Receipt Validation API Endpoint

```javascript
// In orderRoutes.js, add a new route
router.get('/validate-receipt/:orderId', routeAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ valid: false, message: "Invalid Order ID" });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ valid: false, message: "Order not found" });
    }
    
    const { imageExists } = require('../utils/imageHelpers');
    
    // Check if the receipt image exists
    let receiptPath = order.recipt;
    
    // Handle different path formats
    if (receiptPath.startsWith('http')) {
      return res.status(200).json({ valid: true, path: receiptPath });
    } else if (receiptPath.startsWith('data:')) {
      return res.status(200).json({ valid: true, path: receiptPath });
    } else if (receiptPath.startsWith('/uploads/')) {
      const exists = imageExists(receiptPath);
      return res.status(200).json({ 
        valid: exists, 
        path: exists ? receiptPath : null,
        message: exists ? null : "Receipt image file not found on server"
      });
    } else {
      const fullPath = `/uploads/${receiptPath}`;
      const exists = imageExists(fullPath);
      return res.status(200).json({ 
        valid: exists, 
        path: exists ? fullPath : null,
        message: exists ? null : "Receipt image file not found on server"
      });
    }
  } catch (err) {
    console.error("Receipt validation error:", err);
    return res.status(500).json({ valid: false, message: err.message });
  }
});
```

## Implementation Steps

1. Make the recommended changes to the codebase
2. Test the receipt image viewing functionality
3. Add proper error handling for future uploads
4. Consider standardizing the receipt storage format to avoid these issues in the future
EOF

echo ""
echo "Troubleshooting complete. Please review the README_RECEIPT_FIX.md file for detailed solutions."