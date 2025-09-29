const BankDetails = require("../model/bankDetailsModel");

// Create bank details
async function createBankDetails(req, res) {
  try {
    const { bankName, accountNumber, accountHolderName, branch, isActive, paymentType } = req.body;

    const bankDetails = new BankDetails({
      accountHolderName,
      bankName,
      accountNumber,
      branch,
      isActive: isActive !== undefined ? isActive : true,
      paymentType: paymentType || 'bank',
    });

    const savedBankDetails = await bankDetails.save();
    res.status(201).json(savedBankDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create bank details", error: error.message });
  }
}

// Get all bank details
async function getAllBankDetails(req, res) {
  try {
    const { paymentType, active } = req.query;
    const filter = {};
    
    // Add filter by paymentType if provided
    if (paymentType) {
      filter.paymentType = paymentType;
    }
    
    // Add filter by active status if provided
    if (active !== undefined) {
      filter.isActive = active === 'true';
    } else {
      // By default, return only active bank details
      filter.isActive = true;
    }
    
    const allBankDetails = await BankDetails.find(filter);
    res.status(200).json(allBankDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch bank details", error: error.message });
  }
}

// Get single bank detail by id
async function getBankDetailsById(req, res) {
  try {
    const bankDetails = await BankDetails.findById(req.params.id);
    if (!bankDetails) {
      return res.status(404).json({ message: "Bank details not found" });
    }
    res.status(200).json(bankDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch bank details", error: error.message });
  }
}

// Update bank details by id
async function updateBankDetails(req, res) {
  try {
    const updates = req.body;
    const updatedBankDetails = await BankDetails.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedBankDetails) {
      return res.status(404).json({ message: "Bank details not found" });
    }

    res.status(200).json(updatedBankDetails);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update bank details", error: error.message });
  }
}

// Delete bank details by id
async function deleteBankDetails(req, res) {
  try {
    const deleted = await BankDetails.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: "Bank details not found" });
    }
    res.status(200).json({ message: "Bank details deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete bank details", error: error.message });
  }
}

// Set bank details active status by id
async function setBankDetailsActiveStatus(req, res) {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be a boolean" });
    }

    const bankDetails = await BankDetails.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!bankDetails) {
      return res.status(404).json({ message: "Bank details not found" });
    }

    res.status(200).json({
      message: `Bank details ${isActive ? "activated" : "deactivated"} successfully`,
      bankDetails,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to update bank details active status", error: error.message });
  }
}

module.exports = {
  createBankDetails,
  getAllBankDetails,
  getBankDetailsById,
  updateBankDetails,
  deleteBankDetails,
  setBankDetailsActiveStatus,
};
