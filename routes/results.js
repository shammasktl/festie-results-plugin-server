import express from "express";
import {
  getEvents,
  createEvent,
  getParticipants,
  addParticipants,
  saveResults,
  getResults
} from "../controllers/resultController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Public
router.get("/events", getEvents);
router.get("/event/:id/candidates", getParticipants);
router.get("/event/:id/results", getResults);

// Admin only
router.post("/events", verifyToken, createEvent);
router.post("/event/:id/candidates", verifyToken, addParticipants);
router.post("/event/:id/results", verifyToken, saveResults);

export default router;
