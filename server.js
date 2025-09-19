import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import resultsRoutes from "./routes/results.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use("/api", resultsRoutes);

app.get("/", (req, res) => {
  res.send("Result Control Plugin Backend 🚀");
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});
