import express from "express";
import {
  createEvent,
  getParticipants,
  addParticipants,
  saveResults,
  getResults,
  getEvents,
} from "../controllers/resultController.js";
import { verifyToken, verifyTokenOptional } from "../middleware/auth.js";

const router = express.Router();

// Public + optional auth
router.get("/events", verifyTokenOptional, getEvents);

// Public
router.get("/event/:id/candidates", getParticipants);
router.get("/event/:id/results", getResults);

// Admin only
router.post("/events", verifyToken, createEvent);
router.post("/event/:id/candidates", verifyToken, addParticipants);
router.post("/event/:id/results", verifyToken, saveResults);

export default router;
