const express = require("express");
const gameRouter = express.Router();
const gameController = require("../controller/game");
const {upload} = require("../middleware/upload");
const adminRole = require("../middleware/adminRole");
const routeAuth = require("../middleware/routeAuth");

gameRouter.post("/",routeAuth,adminRole, upload.single("image"), gameController.createGame);

gameRouter.get("/", gameController.getAllGames);

gameRouter.get("/:id",routeAuth, gameController.getGameById);

gameRouter.put("/:id",routeAuth,adminRole, gameController.updateGame);

gameRouter.delete("/:id",routeAuth,adminRole, gameController.deleteGame);

gameRouter.patch("/status/:id",routeAuth,adminRole, gameController.setGameActiveStatus);

module.exports = gameRouter;
