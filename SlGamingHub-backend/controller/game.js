const Game = require("../model/gameModel");
const { processImage } = require("../middleware/upload");

//Create Game
async function createGame(req, res) {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ success: false, message: "Image file is required" });
    }

    const { gamename, description, reagan, isActive } = req.body;
    const imageUrl = await processImage(req.file);

    const game = await Game.create({
      gamename,
      image: imageUrl,
      description,
      reagan,
      isActive,
    });
    console.log(game);
    res.status(201).json({ success: true, data: game });
  } catch (error) {
    console.log(error);
    res.status(400).json({ success: false, message: error.message });
  }
}

async function getAllGames(req, res) {
  try {
    const games = await Game.find().sort({ createdAt: -1 });
    console.log(games);
    res.status(200).json({ success: true, data: games });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
}

//Get Single Game
async function getGameById(req, res) {
  try {
    const { id } = req.params;

    const game = await Game.findById(id);
    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    res.status(200).json({ success: true, data: game });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

//Update Game
async function updateGame(req, res) {
  try {
    const { id } = req.params;
    const { gamename, description, reagan, isActive } = req.body;

    let updateData = { gamename, description, reagan, isActive };

   if (req.file) {
      const imageUrl = await processImage(req.file);
      updateData.image = imageUrl;
    }

    const game = await Game.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    res.status(200).json({ success: true, data: game });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
}

// Delete Game
async function deleteGame(req, res) {
  try {
    const { id } = req.params;

    const game = await Game.findByIdAndDelete(id);

    if (!game) {
      return res
        .status(404)
        .json({ success: false, message: "Game not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Game deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
}

//Set Game Active/Inactive Status
async function setGameActiveStatus(req, res) {
  try {
    const { id } = req.params; // Game ID from URL
    const { isActive } = req.body; // Status from body (true / false)

    // Validate input
    if (typeof isActive !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isActive must be a boolean value (true or false)",
      });
    }

    // Update game status
    const game = await Game.findByIdAndUpdate(
      id,
      { isActive },
      { new: true, runValidators: true }
    );

    if (!game) {
      return res.status(404).json({
        success: false,
        message: "Game not found",
      });
    }

    res.status(200).json({
      success: true,
      message: `Game status updated to ${isActive ? "Active" : "Inactive"}`,
      data: game,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
}

module.exports = {
  createGame,
  getAllGames,
  getGameById,
  updateGame,
  deleteGame,
  setGameActiveStatus,
};
