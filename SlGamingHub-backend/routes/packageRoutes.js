const express = require("express");
const packageRouter = express.Router();
const { upload } = require("../middleware/upload");
const packageController = require("../controller/package");
const adminRole = require("../middleware/adminRole");
const routeAuth = require("../middleware/routeAuth")


packageRouter.post("/",routeAuth,adminRole,upload.single("image"), packageController.createPackage);


packageRouter.get("/", packageController.getAllPackages);


packageRouter.get("/:id",routeAuth, packageController.getPackageById);


packageRouter.put("/:id",routeAuth,adminRole, packageController.updatePackage);


packageRouter.delete("/:id",routeAuth,adminRole,  packageController.deletePackage);


packageRouter.patch("/status/:id",routeAuth,adminRole,  packageController.setPackageActiveStatus);

packageRouter.get("/game/:gameId",packageController.getAllPackagesByGameId)

module.exports = packageRouter;
