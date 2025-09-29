const express = require("express");
const orderRouter = express.Router();
const orderController = require("../controller/order");
const {upload} = require("../middleware/upload");
const routeAuth = require("../middleware/routeAuth");
const customerRole = require("../middleware/customerRole");
const adminRole = require("../middleware/adminRole");

orderRouter.post("/",routeAuth,customerRole, upload.single("recipt"), orderController.createOrder);
orderRouter.get("/", routeAuth,orderController.getAllOrders);
orderRouter.get("/:id",routeAuth, orderController.getOrderById);
orderRouter.put("/:id",routeAuth, upload.single("recipt"), orderController.updateOrder);
orderRouter.delete("/:id",routeAuth, orderController.deleteOrder);
orderRouter.patch("/status/:id",routeAuth,adminRole, orderController.setOrderStatus);

module.exports = orderRouter;
