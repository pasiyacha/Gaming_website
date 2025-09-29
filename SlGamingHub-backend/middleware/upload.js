const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");

// Multer memory storage (sharp process එකට)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed"));
    }
  },
});

// Sharp process function
async function processImage(file, req) {
  try {
    const filename = `package-${Date.now()}.jpeg`;
    const outputPath = path.join(__dirname, "../uploads", filename);
    
    // Make sure the uploads directory exists
    const uploadDir = path.join(__dirname, "../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Process image with sharp
    await sharp(file.buffer)
      .resize({ width: 300 })      
      .jpeg({ quality: 70 })       
      .toFile(outputPath);
    
    // Get the host from the request if available
    const host = req && req.get("host") ? req.get("host") : process.env.API_HOST || "localhost:5000";
    const protocol = req && req.protocol ? req.protocol : "http";
    
    // Return a complete URL that can be stored in MongoDB
    return `${protocol}://${host}/uploads/${filename}`;
  } catch (error) {
    console.error("Image processing error:", error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
}

module.exports = { upload, processImage };
