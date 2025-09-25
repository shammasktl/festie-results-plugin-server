import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import resultsRoutes from "./routes/results.js";
import authRoutes from "./routes/auth.js";

// Load environment variables
dotenv.config();

const app = express();

// Production-ready CORS configuration
const allowedOrigins = [
  process.env.CORS_ORIGIN,// Add your frontend Render URL here
  "http://localhost:5173",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      if (allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  })
);

// Body parsing and cookies
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Trust proxy for Render deployment
app.set('trust proxy', 1);

// Health check endpoint for Render
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Festie Results Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Routes
app.use("/api", resultsRoutes);
app.use("/api/auth", authRoutes);

// Root endpoint
app.get("/", (req, res) => {
  res.json({
    message: "🚀 Festie Results Backend API",
    version: "1.0.0",
    environment: process.env.NODE_ENV || 'development',
    features: [
      "Auto-generated Event IDs",
      "New 1-11 Scoring System",
      "Team-based Management", 
      "Strategic Results",
      "Session-based Authentication"
    ],
    endpoints: {
      health: "/health",
      documentation: "/api-docs",
      auth: "/api/auth/*",
      events: "/api/events",
      results: "/api/event/:id/results"
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    availableEndpoints: ['/health', '/api/*', '/']
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(err.status || 500).json({
    error: 'Internal Server Error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack })
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Festie Results Backend running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔥 Health check: http://localhost:${PORT}/health`);
  console.log(`🌐 CORS Origins: ${allowedOrigins.join(', ')}`);
});
