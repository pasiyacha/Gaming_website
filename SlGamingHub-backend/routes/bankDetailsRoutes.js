const express = require("express");
const bankDetailsRoutes = express.Router();
const bankDetailsController = require("../controller/bankDetails");
const adminRole = require("../middleware/adminRole");
const routeAuth = require("../middleware/routeAuth");

bankDetailsRoutes.post("/",routeAuth,adminRole, bankDetailsController.createBankDetails);

bankDetailsRoutes.get("/", bankDetailsController.getAllBankDetails);

bankDetailsRoutes.get("/:id",routeAuth,adminRole, bankDetailsController.getBankDetailsById);

bankDetailsRoutes.put("/:id",routeAuth,adminRole, bankDetailsController.updateBankDetails);

bankDetailsRoutes.delete("/:id",routeAuth,adminRole, bankDetailsController.deleteBankDetails);

bankDetailsRoutes.patch("/status/:id",routeAuth,adminRole, bankDetailsController.setBankDetailsActiveStatus);

module.exports = bankDetailsRoutes;
