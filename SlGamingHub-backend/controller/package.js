const Package = require("../model/packageModel");
const Game = require("../model/gameModel");
const {processImage} = require("../middleware/upload");

// Create Package
async function createPackage(req, res) {
  try {
    const { packagename, price, description, isActive, gameId } = req.body || {};


    console.log(packagename)
    console.log(price)
    console.log(description)
    console.log(gameId)

    if (!packagename || !price || !description || !gameId) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image file is required" });
    }

    const imageUrl = await processImage(req.file);

    console.log("Processed Image URL:", imageUrl);

    const gameExists = await Game.findById(gameId);
    if (!gameExists) {
      return res.status(404).json({ success: false, message: "Game not found" });
    }

    const activeStatus = typeof isActive === "boolean" ? isActive : true;

    const newPackage = await Package.create({
      packagename,
      price,
      description,
      isActive: activeStatus,
      gameId,
      image: imageUrl,
    });

    res.status(201).json({ success: true, data: newPackage });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// Get All Packages
async function getAllPackages(req, res) {
  try {
    const packages = await Package.find();
    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Get Single Package by ID
async function getPackageById(req, res) {
  try {
    const { id } = req.params;
    const packageData = await Package.findById(id);
    if (!packageData) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }
    res.status(200).json({ success: true, data: packageData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Update Package by ID
async function updatePackage(req, res) {
  try {
    const { id } = req.params;
    const { packagename, price, description, isActive, gameId } = req.body || {};

    let imageUrl;
    if (req.file) {
      imageUrl = await processImage(req.file);
    }

    if (gameId) {
      const gameExists = await Game.findById(gameId);
      if (!gameExists) {
        return res.status(404).json({ success: false, message: "Game not found" });
      }
    }

    const updatedData = { packagename, price, description, isActive, gameId };
    if (imageUrl) updatedData.image = imageUrl;

    const updatedPackage = await Package.findByIdAndUpdate(
      id,
      updatedData,
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    res.status(200).json({ success: true, data: updatedPackage });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// Delete Package by ID
async function deletePackage(req, res) {
  try {
    const { id } = req.params;
    const deletedPackage = await Package.findByIdAndDelete(id);

    if (!deletedPackage) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    res.status(200).json({ success: true, message: "Package deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

// Set Package Active/Inactive
async function setPackageActiveStatus(req, res) {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ success: false, message: "isActive must be a boolean" });
    }

    const updatedPackage = await Package.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!updatedPackage) {
      return res.status(404).json({ success: false, message: "Package not found" });
    }

    res.status(200).json({ success: true, data: updatedPackage });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// Get Packages by Game ID
async function getAllPackagesByGameId(req, res) {
  try {
    const { gameId } = req.params;
    const packages = await Package.find({ gameId });

    if (!packages || packages.length === 0) {
      return res.status(404).json({ success: false, message: "No packages found for this game" });
    }

    res.status(200).json({ success: true, data: packages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  createPackage,
  getAllPackages,
  getPackageById,
  updatePackage,
  deletePackage,
  setPackageActiveStatus,
  getAllPackagesByGameId,
};
