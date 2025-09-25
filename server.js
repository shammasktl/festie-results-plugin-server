import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import resultsRoutes from "./routes/results.js";
import authRoutes from "./routes/auth.js";

// Load environment variables
dotenv.config();

const app = express();

// Simple CORS configuration
app.use(cors({
  origin: true,
  credentials: true,
}));

// Middleware
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api", resultsRoutes);
app.use("/api/auth", authRoutes);

// Basic root route
app.get("/", (req, res) => {
  res.json({ message: "Festie Results API" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
