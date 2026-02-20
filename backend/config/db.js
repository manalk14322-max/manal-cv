const mongoose = require("mongoose");

// Attempt MongoDB connection; if unavailable, continue in fallback mode.
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.warn(`MongoDB unavailable (${error.message}). Running in in-memory fallback mode.`);
  }
};

module.exports = connectDB;
