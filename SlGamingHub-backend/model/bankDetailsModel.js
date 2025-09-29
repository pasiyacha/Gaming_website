const mongoose = require("mongoose");

const bankDetailsSchema = mongoose.Schema(
  {
    accountHolderName: {
      type: String,
      required: [true, "Account holder name is required"],
      minlength: [3, "Account holder name must be at least 3 characters"],
      maxlength: [50, "Account holder name can't exceed 50 characters"],
      trim: true,
    },
    bankName: {
      type: String,
      required: [true, "Bank name is required"],
      minlength: [3, "Bank name must be at least 3 characters"],
      maxlength: [50, "Bank name can't exceed 50 characters"],
      trim: true,
    },
    accountNumber: {
      type: String,
      required: [true, "Account number is required"],
      minlength: [8, "Account number must be at least 8 digits"],
      maxlength: [20, "Account number can't exceed 20 digits"],
      validate: {
        validator: function (v) {
          return /^\d+$/.test(v);  // only digits allowed
        },
        message: (props) => `${props.value} is not a valid account number! Only digits are allowed.`,
      },
      trim: true,
    },
    branch: {
      type: String,
      required: [true, "Branch is required"],
      minlength: [2, "Branch name must be at least 2 characters"],
      maxlength: [50, "Branch name can't exceed 50 characters"],
      trim: true,
    },
    isActive: {
      type: Boolean,
      required: [true, "isActive flag is required"],
      default: true,
    },
    paymentType: {
      type: String,
      enum: ["bank", "ezcash"],
      default: "bank",
      required: [true, "Payment type is required"],
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("BankDetails", bankDetailsSchema);
