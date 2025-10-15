const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(error.name, error.message);
  console.error(error.stack);
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
});

dotenv.config();
const app = express();

// Get allowed origins from environment variables or use defaults
const corsOrigins = process.env.CORS_ORIGINS ? 
  process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()) : 
  [
    'http://16.170.236.106', 
    'https://16.170.236.106', 
    'http://slgaminghub.com', 
    'https://slgaminghub.com',
    'http://localhost:5173', 
    'http://localhost:3000'
  ];

console.log('CORS configured with origins:', corsOrigins);

// Comprehensive CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    console.log('CORS check for origin:', origin);
    
    // Allow requests with no origin (like mobile apps, curl requests, or same-origin)
    if (!origin) {
      console.log('No origin header - allowing request');
      return callback(null, true);
    }
    
    // Check if the origin is in the allowed list
    if (corsOrigins.includes(origin)) {
      console.log('Origin allowed:', origin);
      return callback(null, true);
    } else {
      console.log('CORS blocked request from:', origin);
      // In production, you might want to be more restrictive
      // For now, we'll allow all origins to debug the issue
      return callback(null, true);
    }
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With', 
    'Content-Type', 
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-HTTP-Method-Override'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
}));

// Additional CORS middleware for explicit handling
app.use((req, res, next) => {
  const origin = req.headers.origin;
  
  // Set CORS headers explicitly
  if (origin && corsOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Temporarily allow all origins for debugging
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request from:', origin);
    return res.status(200).end();
  }
  
  next();
});

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url} from ${req.ip}`);
  next();
});


app.use(bodyParser.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Basic test route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to SlGamingHub API", status: "Server is running" });
});

// Test API endpoint - note this will be accessed as /api/test but served from /test due to Nginx rewrite
app.get("/test", (req, res) => {
  res.json({ 
    message: "API is working",
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    origin: req.headers.origin,
    host: req.headers.host
  });
});

// Only try to connect to MongoDB if the connection string is valid
const connectionString = process.env.MONGO_URL ||"mongodb+srv://forever:forever123@cluster0.qbgajlz.mongodb.net/new";
if (connectionString) {
  console.log("Attempting to connect to MongoDB with:", connectionString);
  
  mongoose.connect(connectionString)
    .then(() => {
      console.log("MongoDB Connected");
      
      // Only load routes after MongoDB is connected
      const userRoutes = require("./routes/userRoutes");
      const bankRoutes = require("./routes/bankDetailsRoutes");
      const gameRouter = require("./routes/gameRoutes");
      const packageRouter = require("./routes/packageRoutes");
      const orderRouter = require("./routes/orderRoutes");
      const aiRouter = require("./routes/aiRoutes");
      
      // Routes without /api prefix since Nginx strips it
      app.use("/users", userRoutes);
      app.use("/banks", bankRoutes);
      app.use("/game", gameRouter);
      app.use("/package", packageRouter);
      app.use("/order", orderRouter);
      // Add an alias to match frontend expectation
      app.use("/orders", orderRouter);
      
      // Add receipt routes
      const receiptRoutes = require('./routes/receiptRoutes');
      app.use("/receipts", receiptRoutes);
      
      // Add Claude Sonnet 4 AI routes
      app.use("/ai", aiRouter);
    })
    .catch((err) => {
      console.error("MongoDB Connection Error:", err.message);
      console.log("Server running in limited mode without database access");
    });
} else {
  console.log("No MongoDB connection string found. Running in test mode without database.");
}

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Logging error...');
  console.error(err.name, err.message);
  console.error(err.stack);
  
  // Don't exit in production, just log the error
  if (process.env.NODE_ENV !== 'production') {
    server.close(() => {
      process.exit(1);
    });
  }
});