const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const connectDB = require("./config/db");

dotenv.config();

const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const { hasRealOpenAIKey, hasOllamaConfigured, checkOllamaReachable } = require("./controllers/resumeController");

connectDB();

const app = express();

// Parse JSON request bodies.
app.use(express.json({ limit: "1mb" }));

// Enable CORS for frontend origin.
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Backend is running",
    frontend: process.env.CLIENT_URL || "http://localhost:5173",
    apiHealth: "/api/health",
  });
});

app.get("/api/health", async (req, res) => {
  const dbConnected = mongoose.connection.readyState === 1;
  const ollamaReachable = await checkOllamaReachable();

  let aiMode = "template";
  if (hasRealOpenAIKey) aiMode = "openai";
  else if (ollamaReachable) aiMode = "ollama";

  res.status(200).json({
    message: "API is running",
    dbConnected,
    openAiConfigured: hasRealOpenAIKey,
    ollamaEnabled: hasOllamaConfigured,
    ollamaReachable,
    aiMode,
    storageMode: dbConnected ? "mongodb" : "fallback-file",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);

// Centralized error fallback.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
