import { Router } from "express";
import authController from "../controllers/authController.js";
const authRoute = Router();

authRoute.get("/login", authController.renderIndex);
authRoute.get("/logout", authController.logoutUser);
authRoute.post("/login", authController.loginUser);

export { authRoute };