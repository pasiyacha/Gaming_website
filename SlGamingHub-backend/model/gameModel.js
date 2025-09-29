const mongoose = require("mongoose");

const gameSchema = new mongoose.Schema(
  {
    gamename: {
      type: String,
      required: [true, "Game name is required"],
      minlength: [3, "Game name must be at least 3 characters long"],
      maxlength: [50, "Game name cannot exceed 50 characters"],
      trim: true,
    },
    image: {
      type: String,
      required: [true, "Image URL is required"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [500, "Description cannot exceed 500 characters"],
      trim: true,
    },
    reagan: {
      type: String,
      enum: {
        values: ["singapore", "indonesia"],
        message: "Region must be either 'singapore' or 'indonesia'",
      },
      required: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Game", gameSchema);
