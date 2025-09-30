import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import authRoutes from "./routes/auth.js";
import hackathonRoutes from "./routes/hackathon.js";
import registrationRoutes from "./routes/registration.js";
import profileRoutes from "./routes/profile.js";
import teamRoutes from "./routes/team.js";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Update CORS configuration
app.use(
  cors({
    origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
    credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Authorization"],
  })
);

// Add request logging
app.use((req, res, next) => {
  console.log(`📡 ${req.method} ${req.url}`);
  next();
});

app.use(express.json({ limit: "50mb" }));

// Serve uploaded files
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date() });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/hackathons", hackathonRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api", profileRoutes);
app.use("/api", teamRoutes);

// Update error handling
app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({
    error: true,
    message: err.message || "Internal server error",
    path: req.path,
  });
});

// Update server startup
const startServer = async () => {
  try {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`
        🚀 Server running on port ${PORT}
        📁 API endpoint: http://localhost:${PORT}/api
        ⚡ Environment: ${process.env.NODE_ENV}
      `);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
