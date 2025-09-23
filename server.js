import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import resultsRoutes from "./routes/results.js";
import authRoutes from "./routes/auth.js";

dotenv.config();

const app = express();

// CORS: allow credentials for cookie-based auth
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    credentials: true,
  })
);

// Body + cookies
app.use(express.json());
app.use(cookieParser());

// Routes
app.use("/api", resultsRoutes);
app.use("/api/auth", authRoutes);

app.get("/", (req, res) => {
  res.send("Result Control Plugin Backend 🚀");
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
