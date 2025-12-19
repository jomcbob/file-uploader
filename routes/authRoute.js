import { Router } from "express";
import authController from "../controllers/authController.js";
const authRoute = Router();

authRoute.get("/login", authController.renderIndex);
authRoute.get("/signup", authController.renderSignUp);

authRoute.get("/logout", authController.logoutUser);

authRoute.post("/login", authController.loginUser);
authRoute.post("/signup", authController.signupUser);

export { authRoute };