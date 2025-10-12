const jwt = require("jsonwebtoken");
const OTP = require("../model/otpModel");
const generateOTP = require("../utils/generateOtp");
const sendEmail = require("../utils/sendEmail");
const { TempUser, User } = require("../model/userModel");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "slgaminghub62@gmail.com", // your Gmail
    pass: "oruxobffojypgeje", // Gmail App Password
  },
});

// Function to send OTP email
async function sendOTPEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP Code",
    text: `Your OTP code is: ${otp}. It will expire in 1 minute.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}: ${otp}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Could not send OTP email");
  }
}

module.exports = sendOTPEmail;

async function register(req, res) {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    if (!name || !email || !password || !confirmPassword || !phone)
      return res.status(400).json({ message: "All fields are required" });

    if (password !== confirmPassword)
      return res.status(400).json({ message: "Passwords do not match" });

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create temporary user
    const tempUser = await TempUser.create({
      name,
      email,
      password: hashedPassword,
      phone,
    });

    // Generate OTP
    const otpCode = crypto.randomInt(100000, 999999).toString();

    const otp = await OTP.create({
      userId: tempUser._id,
      userModel: "TempUser",
      code: otpCode,
      type: "email",
      expiresAt: new Date(Date.now() + 1 * 60 * 1000), // 1 minute
    });

    // Send OTP to email
    await sendOTPEmail(email, otpCode);

    res
      .status(200)
      .json({ message: "OTP sent to your email", tempUserId: tempUser._id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
}

async function verifyOtp(req, res) {
  try {
    const { tempUserId, code } = req.body;

    if (!tempUserId || !code) {
      return res
        .status(400)
        .json({ message: "tempUserId and OTP are required" });
    }

    const otp = await OTP.findOne({
      userId: tempUserId,
      code,
      type: "email",
      verified: false,
    });

    if (!otp) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (otp.expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP expired" });
    }

    // Mark OTP as verified
    otp.verified = true;
    await otp.save();

    const tempUser = await TempUser.findById(tempUserId).select("+password");

    if (!tempUser) {
      return res.status(400).json({ message: "Temporary user not found" });
    }

    // Create permanent user
    const newUser = await User.create({
      name: tempUser.name,
      email: tempUser.email,
      password: tempUser.password,
      phone: tempUser.phone,
      isEmailVerified: true,
    });

    // Delete temp user
    await TempUser.deleteOne({ _id: tempUserId });

    // Optional: generate JWT
    const token = jwt.sign(
      { id: newUser._id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRY || "30d" }
    );

    return res.status(200).json({
      message: "Email verified successfully",
      token,
      user: newUser,
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    return res.status(500).json({ message: "Server error verifying OTP" });
  }
}

module.exports = { verifyOtp };

// REGISTER

// REQUEST PASSWORD RESET
async function requestPasswordReset(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete old reset OTPs for this user
    await OTP.deleteMany({ userId: user._id, type: "reset" });

    // Generate OTP for reset
    const resetOtp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    await OTP.create({
      userId: user._id,
      userModel: "User",
      code: resetOtp,
      type: "reset",
      expiresAt: otpExpiresAt,
    });

    // Send OTP via email
    try {
      await sendEmail(
        user.email,
        "Password Reset OTP",
        `Hello ${user.name},\n\nYour password reset OTP is: ${resetOtp}\nIt expires in 10 minutes.`
      );
    } catch (err) {
      await OTP.deleteMany({ userId: user._id, type: "reset" });
      return res
        .status(500)
        .json({ message: "Failed to send reset OTP email" });
    }

    res.json({
      message: "Password reset OTP sent to your email",
      email: user.email,
      expiresAt: otpExpiresAt,
    });
  } catch (err) {
    console.error("requestPasswordReset error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

// VERIFY RESET OTP & SET NEW PASSWORD
async function resetPassword(req, res) {
  try {
    const { email, code, newPassword, confirmPassword } = req.body;

    if (!email || !code || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const otp = await OTP.findOne({
      userId: user._id,
      code,
      type: "reset",
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Hash and save new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    await user.save();

    // Mark OTP verified and remove all reset OTPs
    otp.verified = true;
    await otp.save();
    await OTP.deleteMany({ userId: user._id, type: "reset" });

    res.json({
      message: "Password reset successful. Please login again.",
    });
  } catch (err) {
    console.error("resetPassword error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

//verify otp

// LOGIN
async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    if (!user.isActive) {
      return res.status(403).json({ message: "Account is deactivated." });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user._id, role: user.role, isEmailVerified: user.isEmailVerified },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
}

// Get all users (admin only)
async function getAll(req, res) {
  try {
    const users = await User.find().select("-password");
    res.json({
      count: users.length,
      users,
    });
  } catch (err) {
    console.error("getAll error:", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
}

// Get single user by ID
async function getUserById(req, res) {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("getUserById error:", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
}

// Update user details
async function updateUser(req, res) {
  try {
    const { name, phone, isActive } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (typeof isActive !== "undefined") updates.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("updateUser error:", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
}

// Set user active status
async function setUserActiveStatus(req, res) {
  try {
    const { isActive } = req.body;
    const userId = req.params.id;

    if (typeof isActive !== "boolean") {
      return res
        .status(400)
        .json({ message: "isActive must be a boolean value" });
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { isActive },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: `User ${isActive ? "activated" : "deactivated"} successfully`,
      user: {
        id: user._id,
        email: user.email,
        isActive: user.isActive,
      },
    });
  } catch (err) {
    console.error("setUserActiveStatus error:", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
}

// Delete user
async function deleteUser(req, res) {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error("deleteUser error:", err);
    res
      .status(500)
      .json({ message: "Server error", error: err.message || err });
  }
}

module.exports = {
  register,
  verifyOtp,
  login,
  getAll,
  getUserById,
  updateUser,
  setUserActiveStatus,
  deleteUser,
  requestPasswordReset,
  resetPassword,
};
