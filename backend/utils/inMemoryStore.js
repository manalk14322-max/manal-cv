// Lightweight in-memory store used when MongoDB is unavailable.
const store = {
  users: [],
  resumes: [],
};

module.exports = store;
