// models/otpModel.js
const mongoose = require("mongoose");

const otpSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true,
    refPath: 'userModel' 
  },
  userModel: {
    type: String,
    required: true,
    enum: ['User', 'TempUser']
  },
  code: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: ["email", "reset"],  
    required: true 
  },
  expiresAt: { 
    type: Date, 
    required: true 
  },
  verified: { 
    type: Boolean, 
    default: false 
  },
}, { timestamps: true });

otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OTP = mongoose.model("OTP", otpSchema);
module.exports = OTP;
