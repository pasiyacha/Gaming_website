const express = require("express");
const {
  verifyOtp,
  register,
  getAll,
  login,
  deleteUser,
  updateUser,
  setUserActiveStatus,
  requestPasswordReset,
  resetPassword,
  getUserById
} = require("../controller/user.js");
const routesAuth = require("../middleware/routeAuth");
const adminRole = require("../middleware/adminRole.js");
const userRouter = express.Router();

userRouter.post("/auth/register", register);
userRouter.post("/email_verfy",verifyOtp)
userRouter.get("/", routesAuth,adminRole, getAll);
userRouter.post("/auth/login", login);
userRouter.delete("/:id", routesAuth,adminRole, deleteUser);
userRouter.put("/:id", routesAuth, updateUser);
userRouter.get("/:id", routesAuth, getUserById);
userRouter.patch("/status/:id", routesAuth,adminRole, setUserActiveStatus);
userRouter.post("/auth/request-password-reset", requestPasswordReset);
userRouter.post("/auth/reset-password", resetPassword);

module.exports = userRouter;
