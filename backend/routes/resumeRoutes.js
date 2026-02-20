const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const { generateResume, generateResumeFromPrompt, getResumeHistory, improveSection } = require("../controllers/resumeController");

const router = express.Router();

router.post("/generate", authMiddleware, generateResume);
router.post("/generate-from-prompt", authMiddleware, generateResumeFromPrompt);
router.post("/improve-section", authMiddleware, improveSection);
router.get("/history", authMiddleware, getResumeHistory);

module.exports = router;
