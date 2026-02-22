const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const { randomUUID } = require("crypto");
const connectDB = require("../config/db");
const User = require("../models/User");
const { readStore, writeStore } = require("../utils/fallbackStore");

const createToken = (userId, role = "user") => {
  return jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const isDbReady = () => mongoose.connection.readyState === 1;

// Register a new user with hashed password.
const signup = async (req, res) => {
  try {
    await connectDB();
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let existingUser;
    if (isDbReady()) {
      existingUser = await User.findOne({ email: normalizedEmail });
    } else {
      const store = await readStore();
      existingUser = store.users.find((u) => u.email === normalizedEmail);
    }

    if (existingUser) {
      return res.status(409).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let user;
    if (isDbReady()) {
      user = await User.create({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "user",
      });
    } else {
      const store = await readStore();
      user = {
        _id: randomUUID(),
        name,
        email: normalizedEmail,
        password: hashedPassword,
        role: "user",
        createdAt: new Date().toISOString(),
      };
      store.users.push(user);
      await writeStore(store);
    }

    return res.status(201).json({
      message: "Signup successful",
      token: createToken(user._id, user.role || "user"),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Signup failed", error: error.message });
  }
};

// Authenticate user and return JWT.
const login = async (req, res) => {
  try {
    await connectDB();
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const normalizedEmail = email.toLowerCase().trim();

    let user;
    if (isDbReady()) {
      user = await User.findOne({ email: normalizedEmail });
    } else {
      const store = await readStore();
      user = store.users.find((u) => u.email === normalizedEmail);
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    return res.status(200).json({
      message: "Login successful",
      token: createToken(user._id, user.role || "user"),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role || "user",
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Login failed", error: error.message });
  }
};

module.exports = {
  signup,
  login,
};
