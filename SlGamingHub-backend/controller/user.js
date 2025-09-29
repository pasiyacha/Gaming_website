const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { User, TempUser } = require("../model/userModel");
const OTP = require("../model/otpModel");
const generateOTP = require("../utils/generateOtp");
const sendEmail = require("../utils/sendEmail");

// REGISTER
async function register(req, res) {
  try {
    const { name, email, password, confirmPassword, phone, role } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Clean expired temp users
    await TempUser.deleteMany({ expiresAt: { $lte: new Date() } });

    // Check if user or temp user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const existingTempUser = await TempUser.findOne({ email });
    if (existingTempUser) {
      return res.status(400).json({
        message: "You already started registration. Please verify OTP.",
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save to TempUser
    const tempUser = await TempUser.create({
      name,
      email,
      phone,
      password: hashedPassword,
      role: role || "customer",
    });

    // Generate OTP and expiry
    const emailOtp = generateOTP();
    const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.create({
      userId: tempUser._id,
      userModel: "TempUser",
      code: emailOtp,
      type: "email",
      expiresAt: otpExpiresAt,
    });

    // Send OTP via email
    try {
      await sendEmail(
        email,
        "Your Verification OTP",
        `Hello ${name},\n\nYour OTP is: ${emailOtp}\nIt expires in 10 minutes.`
      );
    } catch (err) {
      await TempUser.findByIdAndDelete(tempUser._id);
      await OTP.deleteMany({ userId: tempUser._id });
      return res.status(500).json({ message: "Failed to send OTP email" });
    }

    res.status(201).json({
      message: "OTP sent to email. Please verify to complete registration.",
      tempUserId: tempUser._id,
      expiresAt: otpExpiresAt,
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
}

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
    res
      .status(500)
      .json({ message: "Server error", error: err.message });
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
    res
      .status(500)
      .json({ message: "Server error", error: err.message });
  }
}

// VERIFY OTP
async function verifyOtp(req, res) {
  try {
    const { tempUserId, code } = req.body;

    if (!tempUserId || !code) {
      return res
        .status(400)
        .json({ message: "tempUserId and OTP code are required" });
    }

    const otp = await OTP.findOne({
      userId: tempUserId,
      code,
      type: "email",
      verified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otp) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    const tempUser = await TempUser.findById(tempUserId).select("+password");
    if (!tempUser) {
      return res
        .status(400)
        .json({
          message: "Registration session expired. Please register again.",
        });
    }

    const user = await User.create({
      name: tempUser.name,
      email: tempUser.email,
      phone: tempUser.phone,
      password: tempUser.password,
      role: tempUser.role,
      isEmailVerified: true,
    });

    otp.verified = true;
    await otp.save();

    await TempUser.findByIdAndDelete(tempUserId);
    await OTP.deleteMany({ userId: tempUserId });

    // const token = jwt.sign(
    //   { id: user._id, email: user.email, role: user.role },
    //   process.env.JWT_SECRET || "secreat",
    //   { expiresIn: "1d" }
    // );

    res.status(200).json({
      message: "Email verified and registration completed",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isEmailVerified: true,
      },
    
    });
  } catch (error) {
    console.error("OTP verification error:", error);
    res
      .status(500)
      .json({ message: "OTP verification failed", error: error.message });
  }
}

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
  resetPassword
};
