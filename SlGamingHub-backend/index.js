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
  process.env.CORS_ORIGINS.split(',') : 
  ['http://16.170.236.106', 'http://localhost:5173', 'http://localhost:3000'];

console.log('CORS configured with origins:', corsOrigins);

// Updated CORS configuration to allow specific origins
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

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

// Test API endpoint
app.get("/api/test", (req, res) => {
  res.json({ 
    message: "API is working",
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
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
      
      app.use("/api/users", userRoutes);
      app.use("/api/banks", bankRoutes);
      app.use("/api/game", gameRouter);
      app.use("/api/package", packageRouter);
      app.use("/api/order", orderRouter);
      // Add an alias to match frontend expectation
      app.use("/api/orders", orderRouter);
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