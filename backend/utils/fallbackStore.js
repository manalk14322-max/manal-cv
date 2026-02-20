const fs = require("fs");
const path = require("path");

const DB_FILE = path.join(__dirname, "..", "data", "fallback-db.json");
const DB_DIR = path.dirname(DB_FILE);

const ensureStoreFile = async () => {
  try {
    await fs.promises.mkdir(DB_DIR, { recursive: true });
    await fs.promises.access(DB_FILE);
  } catch {
    const initialData = { users: [], resumes: [] };
    await fs.promises.writeFile(DB_FILE, JSON.stringify(initialData, null, 2), "utf-8");
  }
};

const readStore = async () => {
  await ensureStoreFile();
  const raw = await fs.promises.readFile(DB_FILE, "utf-8");
  return JSON.parse(raw);
};

const writeStore = async (data) => {
  await fs.promises.writeFile(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
};

module.exports = {
  readStore,
  writeStore,
};
