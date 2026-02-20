const OpenAI = require("openai");
const mongoose = require("mongoose");
const { randomUUID } = require("crypto");
const Resume = require("../models/Resume");
const { readStore, writeStore } = require("../utils/fallbackStore");

const apiKey = process.env.OPENAI_API_KEY;
const hasRealOpenAIKey = Boolean(apiKey && !apiKey.startsWith("replace_with"));
const openai = hasRealOpenAIKey ? new OpenAI({ apiKey }) : null;

const ollamaBaseUrl = process.env.OLLAMA_BASE_URL || "http://127.0.0.1:11434";
const ollamaModel = process.env.OLLAMA_MODEL || "qwen2.5:0.5b";
const hasOllamaConfigured = String(process.env.OLLAMA_ENABLED || "true").toLowerCase() !== "false";

const isDbReady = () => mongoose.connection.readyState === 1;

const toBullets = (value) => {
  if (!value) return "";
  return value
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => `- ${item}`)
    .join("\n");
};

const splitItems = (value) => {
  if (!value) return [];
  return value
    .split(/\n|,|;|\|/)
    .map((item) => item.trim())
    .filter(Boolean);
};

const cleanGeneratedLine = (line = "") => {
  return line
    .replace(/\*\*/g, "")
    .replace(/`/g, "")
    .replace(/^#{1,6}\s*/g, "")
    .replace(/^[-*•]\s*/g, "")
    .replace(/^\d+[.)]\s*/g, "")
    .trim();
};

const SECTION_HEADINGS = {
  contact: "CONTACT",
  summary: "PROFESSIONAL SUMMARY",
  coreCompetencies: "CORE COMPETENCIES",
  technicalSkills: "TECHNICAL SKILLS",
  tools: "TOOLS AND PLATFORMS",
  softSkills: "SOFT SKILLS",
  experience: "WORK EXPERIENCE",
  projects: "PROJECTS",
  internships: "INTERNSHIPS",
  research: "RESEARCH",
  leadership: "LEADERSHIP",
  volunteer: "VOLUNTEER WORK",
  education: "EDUCATION",
  certifications: "CERTIFICATIONS",
  affiliations: "PROFESSIONAL AFFILIATIONS",
  publications: "PUBLICATIONS",
  awards: "AWARDS",
  languages: "LANGUAGES",
  achievements: "ACHIEVEMENTS",
};

const HEADING_TO_KEY = Object.entries(SECTION_HEADINGS).reduce((acc, [key, heading]) => {
  acc[heading] = key;
  return acc;
}, {});

const emptySectionObject = () => {
  return Object.keys(SECTION_HEADINGS).reduce((acc, key) => {
    acc[key] = [];
    return acc;
  }, {});
};

const parseAiSections = (text = "") => {
  const lines = text
    .split("\n")
    .map((line) => cleanGeneratedLine(line))
    .filter(Boolean);

  const sections = emptySectionObject();
  let currentSection = "";

  lines.forEach((line) => {
    const normalized = line.toUpperCase().replace(/:/g, "").trim();
    const matched = HEADING_TO_KEY[normalized] || HEADING_TO_KEY[normalized.replace(/\s+/g, " ")];
    if (matched) {
      currentSection = matched;
      return;
    }
    if (currentSection) sections[currentSection].push(line);
  });

  return sections;
};

const uniqueItems = (items = []) => {
  const seen = new Set();
  const result = [];
  items.forEach((item) => {
    const normalized = item.toLowerCase();
    if (seen.has(normalized)) return;
    seen.add(normalized);
    result.push(item);
  });
  return result;
};

const bulletize = (items = []) => {
  const cleaned = uniqueItems(items.map((item) => cleanGeneratedLine(item)).filter(Boolean));
  return cleaned.length ? cleaned.map((item) => `- ${item}`).join("\n") : "";
};

const safeSummary = (data, aiSections) => {
  if (aiSections.summary.length) return aiSections.summary[0];

  const topSkills = splitItems(data.technicalSkills || data.coreCompetencies || data.skills || "").slice(0, 3);
  const skillPhrase = topSkills.length ? topSkills.join(", ") : "modern tools and collaborative delivery";

  if (data.professionalSummary) return data.professionalSummary;
  if (data.quickProfile) {
    const compressed = data.quickProfile.replace(/\s+/g, " ").trim().slice(0, 240);
    return `${data.fullName} is a ${data.jobTitle} candidate aligned with this target profile: ${compressed}`;
  }
  return `${data.fullName} is a results-oriented ${data.jobTitle} with practical experience in ${skillPhrase}, focused on delivering clean, user-centered, and business-aligned outcomes.`;
};

const buildProfessionalResume = (data, generatedText = "") => {
  const aiSections = parseAiSections(generatedText);

  const contactLines = uniqueItems([
    [data.email, data.phone, data.location].filter(Boolean).join(" | "),
    [data.linkedin, data.github, data.portfolio].filter(Boolean).join(" | "),
    ...aiSections.contact,
  ].filter(Boolean));

  const coreCompetencies = [
    ...splitItems(data.coreCompetencies || data.skills || ""),
    ...aiSections.coreCompetencies,
  ];

  const technicalSkills = [
    ...splitItems(data.technicalSkills || data.skills || ""),
    ...aiSections.technicalSkills,
  ];

  const tools = [...splitItems(data.toolsAndPlatforms || ""), ...aiSections.tools];
  const softSkills = [...splitItems(data.softSkills || ""), ...aiSections.softSkills];
  const experience = [...splitItems(data.experience || ""), ...aiSections.experience];
  const projects = [...splitItems(data.projects || ""), ...aiSections.projects];
  const internships = [...splitItems(data.internships || ""), ...aiSections.internships];
  const research = [...splitItems(data.research || ""), ...aiSections.research];
  const leadership = [...splitItems(data.leadership || ""), ...aiSections.leadership];
  const volunteer = [...splitItems(data.volunteerWork || ""), ...aiSections.volunteer];
  const education = [...splitItems(data.education || ""), ...aiSections.education];
  const certifications = [...splitItems(data.certifications || ""), ...aiSections.certifications];
  const affiliations = [...splitItems(data.affiliations || ""), ...aiSections.affiliations];
  const publications = [...splitItems(data.publications || ""), ...aiSections.publications];
  const awards = [...splitItems(data.awards || ""), ...aiSections.awards];
  const languages = [...splitItems(data.languages || ""), ...aiSections.languages];
  const achievements = [...splitItems(data.achievements || ""), ...aiSections.achievements];

  const bestSkills = uniqueItems([...technicalSkills, ...coreCompetencies]).slice(0, 4);
  const primarySkill = bestSkills[0] || "web development";

  return `${data.fullName}
${data.jobTitle}

CONTACT
${bulletize(contactLines) || "- Professional contact details available on request"}

PROFESSIONAL SUMMARY
- ${safeSummary(data, aiSections)}

CORE COMPETENCIES
${bulletize(coreCompetencies) || "- Problem solving\n- Team collaboration\n- Communication\n- Adaptability"}

TECHNICAL SKILLS
${bulletize(technicalSkills) || `- ${primarySkill}\n- Frontend and backend development fundamentals\n- API integration\n- Version control with Git`}

TOOLS AND PLATFORMS
${bulletize(tools) || "- Git and GitHub\n- VS Code\n- REST API testing tools\n- Collaboration and productivity tools"}

SOFT SKILLS
${bulletize(softSkills) || "- Time management\n- Stakeholder communication\n- Analytical thinking\n- Ownership mindset"}

WORK EXPERIENCE
${bulletize(experience) || "- Designed and delivered role-relevant features with focus on quality, usability, and performance\n- Collaborated with peers to complete tasks on schedule and improve output consistency"}

PROJECTS
${bulletize(projects) || "- Built portfolio-ready projects aligned with target role requirements\n- Implemented practical functionality and improved user experience through iterative updates"}

INTERNSHIPS
${bulletize(internships) || "- Applied academic and self-learned knowledge in real task environments"}

RESEARCH
${bulletize(research) || "- Studied role-relevant technologies and implementation approaches"}

LEADERSHIP
${bulletize(leadership) || "- Coordinated team tasks and supported delivery planning in collaborative work"}

VOLUNTEER WORK
${bulletize(volunteer) || "- Contributed skills and time to community or team initiatives"}

EDUCATION
${bulletize(education) || "- Educational background aligned with target role"}

CERTIFICATIONS
${bulletize(certifications) || "- Completed self-paced and guided training in job-relevant topics"}

PROFESSIONAL AFFILIATIONS
${bulletize(affiliations) || "- Engaged with professional communities for continuous learning"}

PUBLICATIONS
${bulletize(publications) || "- Technical notes and write-ups available upon request"}

AWARDS
${bulletize(awards) || "- Recognized for consistent quality and professional conduct"}

LANGUAGES
${bulletize(languages) || "- English\n- Urdu"}

ACHIEVEMENTS
${bulletize(achievements) || "- Delivered impactful outcomes through reliable execution and ongoing improvement"}`.trim();
};

const normalizeInputData = (body) => {
  return {
    fullName: body.fullName || "",
    jobTitle: body.jobTitle || "",
    email: body.email || "",
    phone: body.phone || "",
    location: body.location || "",
    linkedin: body.linkedin || "",
    github: body.github || "",
    portfolio: body.portfolio || "",
    quickProfile: body.quickProfile || "",
    professionalSummary: body.professionalSummary || "",
    coreCompetencies: body.coreCompetencies || body.skills || "",
    technicalSkills: body.technicalSkills || body.skills || "",
    toolsAndPlatforms: body.toolsAndPlatforms || "",
    softSkills: body.softSkills || "",
    experience: body.experience || "",
    projects: body.projects || "",
    internships: body.internships || "",
    research: body.research || "",
    leadership: body.leadership || "",
    volunteerWork: body.volunteerWork || "",
    education: body.education || "",
    certifications: body.certifications || "",
    affiliations: body.affiliations || "",
    publications: body.publications || "",
    awards: body.awards || "",
    languages: body.languages || "",
    achievements: body.achievements || "",
  };
};

const extractPromptIdentity = (promptText = "") => {
  const safe = String(promptText || "");
  const nameMatch = safe.match(/(?:^|\n)\s*(?:name)\s*[:\-]\s*([^\n]+)/i);
  const roleMatch = safe.match(/(?:^|\n)\s*(?:role|job\s*title|position)\s*[:\-]\s*([^\n]+)/i);

  return {
    fullName: (nameMatch?.[1] || "").trim() || "Candidate Name",
    jobTitle: (roleMatch?.[1] || "").trim() || "Target Role",
  };
};

const pickPromptField = (promptText = "", labels = []) => {
  const safe = String(promptText || "");
  for (const label of labels) {
    const regex = new RegExp(`(?:^|\\n)\\s*${label}\\s*[:\\-]\\s*([^\\n]+)`, "i");
    const match = safe.match(regex);
    if (match?.[1]?.trim()) return match[1].trim();
  }
  return "";
};

const inferSkillsFromPrompt = (promptText = "") => {
  const knownSkills = [
    "react",
    "node.js",
    "node",
    "mongodb",
    "express",
    "javascript",
    "typescript",
    "python",
    "java",
    "c#",
    "sql",
    "tailwind",
    "figma",
    "aws",
    "docker",
    "git",
    "seo",
    "google ads",
    "meta ads",
  ];

  const lower = String(promptText || "").toLowerCase();
  const found = knownSkills.filter((item) => lower.includes(item));
  if (!found.length) return [];
  return uniqueItems(found.map((item) => (item === "node.js" ? "Node.js" : item.toUpperCase())));
};

const parsePromptToInputData = (promptText = "", identity = {}) => {
  const skillsFromLabel =
    pickPromptField(promptText, ["skills", "technical skills", "tech stack", "stack"]) ||
    inferSkillsFromPrompt(promptText).join(", ");

  return normalizeInputData({
    fullName: identity.fullName || "Candidate Name",
    jobTitle: identity.jobTitle || "Target Role",
    email: pickPromptField(promptText, ["email"]),
    phone: pickPromptField(promptText, ["phone", "contact"]),
    location: pickPromptField(promptText, ["location", "city", "country"]),
    linkedin: pickPromptField(promptText, ["linkedin"]),
    github: pickPromptField(promptText, ["github"]),
    portfolio: pickPromptField(promptText, ["portfolio", "website"]),
    quickProfile: String(promptText || "").trim(),
    professionalSummary: pickPromptField(promptText, ["summary", "professional summary", "profile"]),
    coreCompetencies: skillsFromLabel,
    technicalSkills: skillsFromLabel,
    toolsAndPlatforms: pickPromptField(promptText, ["tools", "platforms"]),
    softSkills: pickPromptField(promptText, ["soft skills"]),
    experience: pickPromptField(promptText, ["experience", "work experience", "employment"]),
    projects: pickPromptField(promptText, ["projects", "project"]),
    internships: pickPromptField(promptText, ["internships", "internship"]),
    research: pickPromptField(promptText, ["research"]),
    leadership: pickPromptField(promptText, ["leadership"]),
    volunteerWork: pickPromptField(promptText, ["volunteer", "volunteer work"]),
    education: pickPromptField(promptText, ["education", "degree", "qualification"]),
    certifications: pickPromptField(promptText, ["certifications", "certification"]),
    affiliations: pickPromptField(promptText, ["affiliations", "memberships"]),
    publications: pickPromptField(promptText, ["publications", "publication"]),
    awards: pickPromptField(promptText, ["awards", "recognitions"]),
    languages: pickPromptField(promptText, ["languages", "language"]),
    achievements: pickPromptField(promptText, ["achievements", "accomplishments"]),
  });
};

const extractPromptDirectives = (promptText = "") => {
  const text = String(promptText || "").replace(/\r/g, " ").trim();
  if (!text) return [];

  return text
    .split(/[.\n]/)
    .map((part) => part.trim())
    .filter((part) => part.length > 18)
    .slice(0, 8);
};

const extractRequestedSections = (promptText = "") => {
  const text = String(promptText || "");
  const requested = [];

  const includeSectionRegex = /include\s+([a-z0-9\s,&/-]+?)\s+section/gi;
  let match = includeSectionRegex.exec(text);
  while (match) {
    const section = match[1].replace(/\s+/g, " ").trim();
    if (section && !requested.includes(section)) requested.push(section);
    match = includeSectionRegex.exec(text);
  }

  const includeSectionsRegex = /include\s+([a-z0-9\s,&/-]+?)\s+sections/gi;
  match = includeSectionsRegex.exec(text);
  while (match) {
    const raw = match[1];
    raw
      .split(/,|and|&/i)
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((section) => {
        if (!requested.includes(section)) requested.push(section);
      });
    match = includeSectionsRegex.exec(text);
  }

  return requested.slice(0, 6);
};

const toTitleCase = (value = "") => {
  return value
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase() : ""))
    .join(" ")
    .trim();
};

const buildPromptAwareResume = (data, promptText = "", aiText = "") => {
  const base = buildProfessionalResume(data, aiText);
  const directives = extractPromptDirectives(promptText);
  const requestedSections = extractRequestedSections(promptText);

  const directiveBullets = directives.length
    ? directives.slice(0, 4).map((line) => `- ${cleanGeneratedLine(line)}`).join("\n")
    : `- Built according to target role requirements for ${data.jobTitle}`;

  let output = base;

  if (!/TARGET ROLE FOCUS/i.test(output)) {
    output += `\n\nTARGET ROLE FOCUS\n${directiveBullets}`;
  }

  requestedSections.forEach((sectionName) => {
    const heading = toTitleCase(sectionName).toUpperCase();
    if (!heading || heading.length < 3) return;
    if (new RegExp(`\\n${heading}\\n`, "i").test(output)) return;

    output += `\n\n${heading}\n- Tailored content aligned with ${data.jobTitle} responsibilities\n- Highlights prepared according to user-requested focus area`;
  });

  return output.trim();
};

const buildPrompt = (data) => {
  return `Create a professional ATS-ready CV in plain text.

Candidate Input:
- Name: ${data.fullName}
- Target Role: ${data.jobTitle}
- Quick Profile Notes: ${data.quickProfile || "N/A"}
- Contact: ${data.email || "N/A"} | ${data.phone || "N/A"} | ${data.location || "N/A"}
- Links: LinkedIn ${data.linkedin || "N/A"}, GitHub ${data.github || "N/A"}, Portfolio ${data.portfolio || "N/A"}
- Professional Summary Input: ${data.professionalSummary || "N/A"}
- Core Competencies: ${data.coreCompetencies || "N/A"}
- Technical Skills: ${data.technicalSkills || "N/A"}
- Tools/Platforms: ${data.toolsAndPlatforms || "N/A"}
- Soft Skills: ${data.softSkills || "N/A"}
- Experience: ${data.experience || "N/A"}
- Projects: ${data.projects || "N/A"}
- Internships: ${data.internships || "N/A"}
- Research: ${data.research || "N/A"}
- Leadership: ${data.leadership || "N/A"}
- Volunteer Work: ${data.volunteerWork || "N/A"}
- Education: ${data.education || "N/A"}
- Certifications: ${data.certifications || "N/A"}
- Affiliations: ${data.affiliations || "N/A"}
- Publications: ${data.publications || "N/A"}
- Awards: ${data.awards || "N/A"}
- Languages: ${data.languages || "N/A"}
- Achievements: ${data.achievements || "N/A"}

Rules:
- If some sections are missing, infer concise professional content from available role and skills.
- Use action verbs and impact-driven bullets.
- Include measurable outcomes where reasonable.
- Keep formatting ATS-friendly and clean.
- Do not use markdown symbols like ** or ###.
- Keep content concise, professional, and job-relevant.

Return sections in this exact order with uppercase headings:
NAME
ROLE
CONTACT
PROFESSIONAL SUMMARY
CORE COMPETENCIES
TECHNICAL SKILLS
TOOLS AND PLATFORMS
SOFT SKILLS
WORK EXPERIENCE
PROJECTS
INTERNSHIPS
RESEARCH
LEADERSHIP
VOLUNTEER WORK
EDUCATION
CERTIFICATIONS
PROFESSIONAL AFFILIATIONS
PUBLICATIONS
AWARDS
LANGUAGES
ACHIEVEMENTS`;
};

const buildPromptOnlyCVInstruction = (promptText) => {
  return `You are a world-class resume writer and career strategist.

User prompt:
${promptText}

Create one polished ATS-friendly CV in plain text that follows user instructions as closely as possible.
Follow these strict rules:
- Do not use markdown symbols.
- Keep language professional, concise, and impact-oriented.
- If user gives specific instructions (tone, style, section focus, section names), follow them.
- If user asks for additional sections, include them as UPPERCASE headings.
- If user did not provide some info, infer safely and keep it realistic.
- Use strong action verbs and measurable impact where possible.
- Avoid generic filler.
- Output must be directly usable as resume content.

Required core headings (must include):
NAME: <full name>
ROLE: <target role>
CONTACT
PROFESSIONAL SUMMARY
TECHNICAL SKILLS
WORK EXPERIENCE
EDUCATION

Recommended headings (include when relevant):
CORE COMPETENCIES
TOOLS AND PLATFORMS
SOFT SKILLS
CERTIFICATIONS
PROFESSIONAL AFFILIATIONS
PUBLICATIONS
AWARDS
LANGUAGES
ACHIEVEMENTS
PROJECTS
INTERNSHIPS
RESEARCH
LEADERSHIP
VOLUNTEER WORK`;
};

const sanitizePromptResumeText = (text = "", inputData = {}) => {
  const lines = String(text || "")
    .split("\n")
    .map((line) => cleanGeneratedLine(line))
    .filter(Boolean);

  if (!lines.length) return "";

  const headingCount = lines.filter((line) => /^[A-Z][A-Z\s/&()-]{2,}$/.test(line.replace(/:/g, ""))).length;
  if (headingCount < 3) return "";

  const hasName = lines.some((line) => /^NAME\s*:/i.test(line));
  const hasRole = lines.some((line) => /^ROLE\s*:/i.test(line));

  if (!hasRole) lines.unshift(`ROLE: ${inputData.jobTitle || "Target Role"}`);
  if (!hasName) lines.unshift(`NAME: ${inputData.fullName || "Candidate Name"}`);

  return lines.join("\n").trim();
};

const buildFallbackResume = (data) => buildProfessionalResume(data, "");

const checkOllamaReachable = async () => {
  if (!hasOllamaConfigured) return false;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const response = await fetch(`${ollamaBaseUrl}/api/tags`, {
      method: "GET",
      signal: controller.signal,
    });
    return response.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
};

const generateWithOpenAI = async (prompt) => {
  if (!openai) return "";

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert resume writer who creates concise ATS-friendly CVs.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.4,
  });

  return completion.choices?.[0]?.message?.content?.trim() || "";
};

const generateWithOllama = async (prompt) => {
  if (!(await checkOllamaReachable())) return "";

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 180000);

  try {
    const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model: ollamaModel, prompt, stream: false, options: { temperature: 0.3, num_predict: 700 } }),
      signal: controller.signal,
    });

    if (!response.ok) return "";

    const data = await response.json();
    return data?.response?.trim() || "";
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
};

const improveSectionWithOpenAI = async ({ sectionKey, currentText, targetRole, fullResumeText }) => {
  if (!openai) return "";

  const prompt = `Rewrite this CV section professionally.

Section: ${sectionKey}
Target Role: ${targetRole || "N/A"}
Current Section Content:
${currentText || "N/A"}

Full Resume Context:
${fullResumeText || "N/A"}

Rules:
- Return only improved bullet content lines, no heading.
- No markdown symbols, no numbering.
- Keep concise, ATS-friendly, and action-oriented.
- Maximum 6 lines.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "You are an expert ATS CV writer. Improve section quality without fluff.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature: 0.35,
  });

  return completion.choices?.[0]?.message?.content?.trim() || "";
};

const improveSectionWithOllama = async ({ sectionKey, currentText, targetRole, fullResumeText }) => {
  if (!(await checkOllamaReachable())) return "";

  const prompt = `Rewrite this CV section professionally.
Section: ${sectionKey}
Target Role: ${targetRole || "N/A"}
Current Section Content:
${currentText || "N/A"}

Full Resume Context:
${fullResumeText || "N/A"}

Return only section content lines, no heading, no markdown, max 6 lines.`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch(`${ollamaBaseUrl}/api/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: ollamaModel,
        prompt,
        stream: false,
        options: { temperature: 0.25, num_predict: 240 },
      }),
      signal: controller.signal,
    });

    if (!response.ok) return "";
    const data = await response.json();
    return data?.response?.trim() || "";
  } catch {
    return "";
  } finally {
    clearTimeout(timeout);
  }
};

const fallbackImproveSection = ({ sectionKey, currentText, targetRole }) => {
  const items = splitItems(currentText);
  if (!items.length) {
    if (sectionKey === "summary") {
      return `Results-driven ${targetRole || "professional"} focused on delivering measurable outcomes, clean execution, and strong cross-team collaboration.`;
    }
    return `Contributed to ${targetRole || "role-relevant"} responsibilities with quality-focused delivery and continuous improvement mindset.`;
  }

  return items
    .slice(0, 6)
    .map((item) => cleanGeneratedLine(item))
    .filter(Boolean)
    .map((item) => {
      if (item.toLowerCase().includes("improved") || item.toLowerCase().includes("led") || item.toLowerCase().includes("built")) {
        return item;
      }
      if (sectionKey === "summary") return item;
      return `Delivered ${item.charAt(0).toLowerCase()}${item.slice(1)}`;
    })
    .join("\n");
};

// Generate resume text from user profile data and store in MongoDB.
const generateResume = async (req, res) => {
  try {
    const inputData = normalizeInputData(req.body);

    if (!inputData.fullName || !inputData.jobTitle) {
      return res.status(400).json({
        message: "fullName and jobTitle are required",
      });
    }

    if (!inputData.technicalSkills && !inputData.coreCompetencies && !inputData.quickProfile && !inputData.experience) {
      return res.status(400).json({
        message: "Add at least one of: skills, competencies, quick profile, or experience",
      });
    }

    const prompt = buildPrompt(inputData);

    let generatedResume = "";
    let aiProvider = "template";

    generatedResume = await generateWithOpenAI(prompt);
    if (generatedResume) {
      aiProvider = "openai";
    } else {
      generatedResume = await generateWithOllama(prompt);
      if (generatedResume) {
        aiProvider = "ollama";
      }
    }

    if (!generatedResume) {
      generatedResume = buildPromptAwareResume(inputData, prompt, "");
      aiProvider = "template";
    } else {
      const sanitized = sanitizePromptResumeText(generatedResume, inputData);
      generatedResume = sanitized || buildPromptAwareResume(inputData, prompt, generatedResume);
    }

    if (isDbReady()) {
      const resumeDoc = await Resume.create({
        user: req.user.id,
        inputData,
        generatedResume,
      });

      return res.status(201).json({
        message: "Resume generated successfully",
        aiProvider,
        resume: {
          id: resumeDoc._id,
          generatedResume: resumeDoc.generatedResume,
          createdAt: resumeDoc.createdAt,
        },
      });
    }

    const store = await readStore();
    const resumeDoc = {
      _id: randomUUID(),
      user: req.user.id,
      inputData,
      generatedResume,
      createdAt: new Date().toISOString(),
    };

    store.resumes.push(resumeDoc);
    await writeStore(store);

    return res.status(201).json({
      message: "Resume generated successfully (fallback mode)",
      aiProvider,
      resume: {
        id: resumeDoc._id,
        generatedResume: resumeDoc.generatedResume,
        createdAt: resumeDoc.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Resume generation failed", error: error.message });
  }
};

// Fetch all generated resumes for authenticated user.
const getResumeHistory = async (req, res) => {
  try {
    if (isDbReady()) {
      const resumes = await Resume.find({ user: req.user.id }).sort({ createdAt: -1 });
      return res.status(200).json({ resumes });
    }

    const store = await readStore();
    const resumes = store.resumes
      .filter((item) => item.user === req.user.id)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    return res.status(200).json({ resumes });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch resume history", error: error.message });
  }
};

const generateResumeFromPrompt = async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || String(prompt).trim().length < 20) {
      return res.status(400).json({ message: "Please provide a detailed prompt (minimum 20 characters)." });
    }

    const identity = extractPromptIdentity(prompt);
    const inputData = parsePromptToInputData(prompt, identity);

    const aiPrompt = buildPromptOnlyCVInstruction(String(prompt).trim());

    let generatedResume = "";
    let aiProvider = "template";

    generatedResume = await generateWithOpenAI(aiPrompt);
    if (generatedResume) {
      aiProvider = "openai";
    } else {
      generatedResume = await generateWithOllama(aiPrompt);
      if (generatedResume) {
        aiProvider = "ollama";
      }
    }

    if (!generatedResume) {
      generatedResume = buildFallbackResume(inputData);
      aiProvider = "template";
    } else {
      generatedResume = buildProfessionalResume(inputData, generatedResume);
    }

    if (isDbReady()) {
      const resumeDoc = await Resume.create({
        user: req.user.id,
        inputData,
        generatedResume,
      });

      return res.status(201).json({
        message: "Prompt CV generated successfully",
        aiProvider,
        resume: {
          id: resumeDoc._id,
          generatedResume: resumeDoc.generatedResume,
          createdAt: resumeDoc.createdAt,
        },
      });
    }

    const store = await readStore();
    const resumeDoc = {
      _id: randomUUID(),
      user: req.user.id,
      inputData,
      generatedResume,
      createdAt: new Date().toISOString(),
    };

    store.resumes.push(resumeDoc);
    await writeStore(store);

    return res.status(201).json({
      message: "Prompt CV generated successfully (fallback mode)",
      aiProvider,
      resume: {
        id: resumeDoc._id,
        generatedResume: resumeDoc.generatedResume,
        createdAt: resumeDoc.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Prompt CV generation failed", error: error.message });
  }
};

const improveSection = async (req, res) => {
  try {
    const { sectionKey, currentText, fullResumeText, targetRole } = req.body;

    if (!sectionKey) {
      return res.status(400).json({ message: "sectionKey is required" });
    }

    let improvedText = "";
    let aiProvider = "template";

    improvedText = await improveSectionWithOpenAI({ sectionKey, currentText, targetRole, fullResumeText });
    if (improvedText) {
      aiProvider = "openai";
    } else {
      improvedText = await improveSectionWithOllama({ sectionKey, currentText, targetRole, fullResumeText });
      if (improvedText) aiProvider = "ollama";
    }

    if (!improvedText) {
      improvedText = fallbackImproveSection({ sectionKey, currentText, targetRole });
      aiProvider = "template";
    }

    const cleaned = improvedText
      .split("\n")
      .map((line) => cleanGeneratedLine(line))
      .filter(Boolean)
      .slice(0, 6)
      .join("\n");

    return res.status(200).json({
      message: "Section improved",
      aiProvider,
      improvedText: cleaned || fallbackImproveSection({ sectionKey, currentText, targetRole }),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to improve section", error: error.message });
  }
};

module.exports = {
  generateResume,
  generateResumeFromPrompt,
  getResumeHistory,
  improveSection,
  hasRealOpenAIKey,
  hasOllamaConfigured,
  checkOllamaReachable,
};


