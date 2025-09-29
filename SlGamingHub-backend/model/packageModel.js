const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    packagename: {
      type: String,
      required: [true, "Package name is required"],
      minlength: [3, "Package name must be at least 3 characters long"],
      maxlength: [50, "Package name cannot exceed 50 characters"],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      minlength: [10, "Description must be at least 10 characters long"],
      maxlength: [500, "Description cannot exceed 500 characters"],
      trim: true,
    },
     image: {
      type: String,
      required: [true, "Image URL is required"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    gameId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Game", 
      required: [true, "Game ID (gameId) is required"],
      validate: {
        validator: mongoose.Types.ObjectId.isValid,
        message: "Invalid Game ID format",
      },
    },
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual for name (alias for packagename)
packageSchema.virtual('name').get(function() {
  return this.packagename;
});

// Populate the gameId and get its name when needed
packageSchema.pre(/^find/, function(next) {
  this.populate({
    path: 'gameId',
    select: 'gamename'
  });
  next();
});

// Virtual for gameName (based on the related game)
packageSchema.virtual('gameName').get(function() {
  return this.gameId ? this.gameId.gamename : 'Unknown Game';
});

module.exports = mongoose.model("Package", packageSchema);
