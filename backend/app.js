const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const { getDbStatus } = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const { hasRealOpenAIKey, hasOllamaConfigured, checkOllamaReachable } = require("./controllers/resumeController");

connectDB();

const app = express();

// Parse JSON request bodies.
app.use(express.json({ limit: "1mb" }));

// Enable CORS for local and deployed frontend origins.
const allowedOrigins = [
  "http://localhost:5173",
  ...(process.env.CLIENT_URL ? [process.env.CLIENT_URL] : []),
  ...(process.env.CLIENT_URLS ? process.env.CLIENT_URLS.split(",").map((v) => v.trim()).filter(Boolean) : []),
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow non-browser tools (no origin header).
      if (!origin) return callback(null, true);

      const isExactAllowed = allowedOrigins.includes(origin);
      let isVercelPreview = false;
      try {
        isVercelPreview = /\.vercel\.app$/i.test(new URL(origin).hostname);
      } catch {
        isVercelPreview = false;
      }

      if (isExactAllowed || isVercelPreview) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
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
  const dbStatus = getDbStatus();
  const dbConnected = dbStatus.dbConnected;
  const ollamaReachable = await checkOllamaReachable();

  let aiMode = "template";
  if (hasRealOpenAIKey) aiMode = "openai";
  else if (ollamaReachable) aiMode = "ollama";

  res.status(200).json({
    message: "API is running",
    dbConnected,
    hasMongoUri: dbStatus.hasMongoUri,
    mongoEnvKey: dbStatus.mongoEnvKey,
    dbError: dbConnected ? "" : dbStatus.dbError,
    openAiConfigured: hasRealOpenAIKey,
    ollamaEnabled: hasOllamaConfigured,
    ollamaReachable,
    aiMode,
    storageMode: dbConnected ? "mongodb" : "fallback-file",
  });
});

app.get("/health", async (req, res) => {
  const dbStatus = getDbStatus();
  const dbConnected = dbStatus.dbConnected;
  const ollamaReachable = await checkOllamaReachable();

  let aiMode = "template";
  if (hasRealOpenAIKey) aiMode = "openai";
  else if (ollamaReachable) aiMode = "ollama";

  res.status(200).json({
    message: "API is running",
    dbConnected,
    hasMongoUri: dbStatus.hasMongoUri,
    mongoEnvKey: dbStatus.mongoEnvKey,
    dbError: dbConnected ? "" : dbStatus.dbError,
    openAiConfigured: hasRealOpenAIKey,
    ollamaEnabled: hasOllamaConfigured,
    ollamaReachable,
    aiMode,
    storageMode: dbConnected ? "mongodb" : "fallback-file",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);
app.use("/auth", authRoutes);
app.use("/resumes", resumeRoutes);

// Centralized error fallback.
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Internal server error" });
});

module.exports = app;
