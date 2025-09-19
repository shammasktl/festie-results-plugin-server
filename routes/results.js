import express from "express";
import {
  getEvents,
  getParticipants,
  saveResults,
  getResults
} from "../controllers/resultController.js";

const router = express.Router();

// API routes
router.get("/events", getEvents);
router.get("/event/:id/participants", getParticipants);
router.get("/event/:id/results", getResults);
router.post("/event/:id/results", saveResults);

export default router;
