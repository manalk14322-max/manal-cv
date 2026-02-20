const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    inputData: {
      fullName: String,
      jobTitle: String,
      email: String,
      phone: String,
      location: String,
      linkedin: String,
      github: String,
      portfolio: String,
      quickProfile: String,
      professionalSummary: String,
      coreCompetencies: String,
      technicalSkills: String,
      toolsAndPlatforms: String,
      softSkills: String,
      experience: String,
      projects: String,
      internships: String,
      research: String,
      leadership: String,
      volunteerWork: String,
      education: String,
      certifications: String,
      affiliations: String,
      publications: String,
      awards: String,
      languages: String,
      achievements: String,
    },
    generatedResume: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Resume", resumeSchema);
