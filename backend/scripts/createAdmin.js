const path = require("path");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const connectDB = require("../config/db");
const User = require("../models/User");
const { readStore, writeStore } = require("../utils/fallbackStore");

dotenv.config({ path: path.join(__dirname, "..", ".env") });

const isDbReady = () => mongoose.connection.readyState === 1;

const main = async () => {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();
  const password = process.env.ADMIN_PASSWORD || "";
  const name = process.env.ADMIN_NAME || "Admin";

  if (!email || !password) {
    console.error("Missing ADMIN_EMAIL or ADMIN_PASSWORD in environment.");
    process.exit(1);
  }

  await connectDB();

  const hashedPassword = await bcrypt.hash(password, 10);

  if (isDbReady()) {
    const existing = await User.findOne({ email });
    if (existing) {
      existing.name = name;
      existing.password = hashedPassword;
      existing.role = "admin";
      await existing.save();
      console.log(`Updated existing user as admin: ${email}`);
    } else {
      await User.create({
        name,
        email,
        password: hashedPassword,
        role: "admin",
      });
      console.log(`Created new admin user: ${email}`);
    }

    await mongoose.connection.close();
    return;
  }

  const store = await readStore();
  const existingIndex = store.users.findIndex((u) => (u.email || "").toLowerCase() === email);

  if (existingIndex >= 0) {
    store.users[existingIndex] = {
      ...store.users[existingIndex],
      name,
      password: hashedPassword,
      role: "admin",
    };
    console.log(`Updated existing fallback user as admin: ${email}`);
  } else {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    store.users.push({
      _id: id,
      name,
      email,
      password: hashedPassword,
      role: "admin",
      createdAt: new Date().toISOString(),
    });
    console.log(`Created fallback admin user: ${email}`);
  }

  await writeStore(store);
};

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to create admin:", error.message);
    process.exit(1);
  });
