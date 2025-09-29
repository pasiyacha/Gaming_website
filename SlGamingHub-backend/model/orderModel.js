const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User ID is required"],
  },
  playerName:{
    type: String,
    required: [true, "Player name is required"],
  },
  playerId:{
    type: String,
    required: [true, "Player ID is required"],
  },
  packageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Package",
    required: [true, "Package ID is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
    default: 1,
    validate: {
      validator: function(v) {
        return v === 1; // Only allow quantity of 1
      },
      message: props => `Quantity must be exactly 1`
    }
  },
  totalPrice: {
    type: Number,
    required: [true, "Total price is required"],
    min: [0, "Total price cannot be negative"],
  },
  date: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: {
      values: ["pending", "completed", "canceled"],
      message: "Status must be either 'pending', 'completed', or 'canceled'",
    },
    default: "pending",
  },
  recipt: {
    type: String,
    required: [true, "Receipt is required"],
    trim: true,
  },
});

module.exports = mongoose.model("Order", orderSchema);
