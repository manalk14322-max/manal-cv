const mongoose = require("mongoose");

let lastDbError = "";
let connectionPromise = null;

const getMongoUri = () => {
  const value = process.env.MONGO_URI || process.env.MONGODB_URI || process.env.DATABASE_URL || "";
  return String(value).trim();
};

const getDbStatus = () => {
  return {
    dbConnected: mongoose.connection.readyState === 1,
    hasMongoUri: Boolean(getMongoUri()),
    mongoEnvKey: process.env.MONGO_URI ? "MONGO_URI" : process.env.MONGODB_URI ? "MONGODB_URI" : process.env.DATABASE_URL ? "DATABASE_URL" : "",
    dbError: lastDbError || "",
  };
};

// Attempt MongoDB connection; if unavailable, continue in fallback mode.
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return;
  if (connectionPromise) return connectionPromise;

  const uri = getMongoUri();

  if (!uri) {
    lastDbError = "Missing Mongo URI. Set MONGO_URI (or MONGODB_URI / DATABASE_URL).";
    console.warn(`MongoDB unavailable (${lastDbError}). Running in in-memory fallback mode.`);
    return;
  }

  connectionPromise = mongoose
    .connect(uri)
    .then(() => {
      lastDbError = "";
      console.log("MongoDB connected");
    })
    .catch((error) => {
      lastDbError = error?.message || "Unknown MongoDB error";
      console.warn(`MongoDB unavailable (${lastDbError}). Running in in-memory fallback mode.`);
    })
    .finally(() => {
      connectionPromise = null;
    });

  return connectionPromise;
};

module.exports = connectDB;
module.exports.getDbStatus = getDbStatus;
