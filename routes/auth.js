import express from "express";
import {
  signup,
  login,
  getProfile,
  refreshToken,
  sessionLogin,
  logout
} from "../controllers/authController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Ensure JSON body parsing for all auth routes
router.use(express.json());

// Public routes
router.post("/signup", signup);
router.post("/login", login);
router.post("/refresh", refreshToken);
router.post("/sessionLogin", sessionLogin);
router.post("/logout", logout);

// Protected routes
router.get("/profile", verifyToken, getProfile);

export default router;
