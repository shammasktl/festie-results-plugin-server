import express from "express";
import {
  createEvent,
  getCandidates,
  addParticipants,
  saveResults,
  getResults,
  getPublishedResults, // ✅ new function to get published results only
  getEvents,
  getEventById, // ✅ new controller
  addProgram,
  getPrograms,
  updateProgramResultsByScore, // ✅ new score-based results function
  getTeams,
  addTeams,
  publishEventResults,
  publishProgramResults // ✅ new program publish function
} from "../controllers/resultController.js";
import { verifyToken, verifyTokenOptional } from "../middleware/auth.js";

const router = express.Router();

// Public + optional auth
router.get("/events", verifyTokenOptional, getEvents);

// Public
router.get("/event/:id", getEventById); // ✅ new route
router.get("/event/:id/candidates", getCandidates);
router.get("/event/:id/teams", getTeams);
router.get("/event/:id/results", getResults);
router.get("/event/:id/published-results", getPublishedResults); // ✅ new route for published results only
router.get("/event/:id/programs", getPrograms);

// Admin only
router.post("/events", verifyToken, createEvent);
router.post("/event/:id/candidates", verifyToken, addParticipants);
router.post("/event/:id/teams", verifyToken, addTeams);
router.post("/event/:id/results", verifyToken, saveResults);
router.post("/event/:id/publish-results", verifyToken, publishEventResults);
router.post("/event/:id/programs", verifyToken, addProgram);
router.patch("/event/:eventId/programs/:programId/scores", verifyToken, updateProgramResultsByScore);
router.post("/event/:eventId/programs/:programId/publish", verifyToken, publishProgramResults);

export default router;
