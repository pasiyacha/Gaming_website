const mongoose = require("mongoose");
const validator = require("validator");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      minlength: [3, "Name must be at least 3 characters"],
      maxlength: [50, "Name can't exceed 50 characters"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      validate: {
        validator: validator.isEmail,
        message: "Please provide a valid email"
      }
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      select: false
    },
    phone: {
      type: String,
      required: [true, "Phone number is required"],
      validate: {
        validator: function(v) {
          return /^\+?\d{10,15}$/.test(v);
        },
        message: "Please provide a valid phone number"
      }
    },
    role: {
      type: String,
      enum: ["admin", "customer"],
      default: "customer"
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }, 
  { timestamps: true }
);

// Temporary User Schema
const tempUserSchema = new mongoose.Schema({
  ...userSchema.obj, // copy all fields
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 100), // 1 mins expire
    index: { expires: '1m' } // auto-delete after 1 mins
  }
});

const User = mongoose.model("User", userSchema) ;
const TempUser = mongoose.model("TempUser", tempUserSchema);

module.exports = { User, TempUser };
