/**
 * Hand-written content. Every line is sourced from the resume
 * (Man_Singh_Resume.pdf, Nov 2026) or the project READMEs — nothing invented.
 * Live numbers (ratings, PRs, solved counts) come from src/data/site.json instead.
 */

export const EXPERIENCE = {
  iit: {
    org: "IIT Patna",
    role: "AI/ML Research Intern",
    period: "Aug 2026 – Present",
    mentor: "under Dr. Sriparna Saha",
    area: "Vision-Language Models",
    question: "Do VLMs reason about football tactics, or only describe what they see?",
    bullets: [
      "Lead a student research team testing whether Vision-Language Models explain why an action succeeds or fails, or only describe what is visible on screen.",
      "Established baselines for open and proprietary VLMs on a ~1,000-question football benchmark: temporal order, causality, space creation, passing lanes.",
      "Extended the benchmark with harder temporal, causal and counterfactual questions that separate tactical reasoning from visual description.",
      "Verified model explanations against player-tracking data; compared performance across tracking data, tactical diagrams and broadcast video.",
      "Proposed reinforcement learning with rewards from tracking-verified tactical claims.",
    ],
  },
  crukx: {
    org: "Crukx",
    role: "Frontend Developer",
    period: "Jun 2026 – Jul 2026",
    bullets: [
      "Redesigned the company website's UI (layouts, hierarchy, styling) in TypeScript, JavaScript, HTML/CSS.",
      "Reworked page structure and components so the whole site follows one consistent design language.",
      "Fixed responsive layouts so pages work properly across screen sizes and devices.",
    ],
  },
};

/**
 * Text the "VLM reasoning" overlay types out. It illustrates the research
 * question (description vs. tactical reasoning). It is not a real model output.
 */
export const VLM_SCRIPT = [
  { tag: "Q", text: "Why did this through-ball create a chance?" },
  { tag: "DESCRIBE", text: "Player 8 passes forward. Player 9 runs. The ball reaches the box." },
  { tag: "REASON", text: "The winger drags the full-back wide, the half-space opens, and 8 plays the lane between CB and FB." },
  { tag: "VERIFY", text: "check each claim against player tracking: gap widened? lane unobstructed? → reward only verified claims" },
] as const;

export const PROJECTS = {
  sentinel: {
    name: "SentinelOps",
    kicker: "Event ingestion & incident intelligence",
    url: "https://github.com/man-singh-dev/SentinelOps",
    pitch:
      "10,000 identical payment-service failures should produce 1 incident with 10,000 related events, not 10,000 alerts.",
    status: "Stage 2 of 11: synchronous ingestion working",
    stack: ["Node.js", "TypeScript", "Fastify", "PostgreSQL", "Drizzle", "Docker", "Vitest", "Zod"],
    inProgress: ["Go worker pool", "RabbitMQ pipeline"],
    points: [
      "Services register and send events over REST; runs in Docker and is tested end-to-end over HTTP.",
      "API keys are SHA-256 hashed before storage and verified against PostgreSQL on every request; bodies are schema-validated before ingestion.",
      "Idempotent ingestion: UNIQUE (service_id, event_id) + INSERT … ON CONFLICT DO NOTHING. Concurrent identical requests store exactly one row.",
      "Tests cover auth, validation, duplicate events and concurrent requests.",
    ],
  },
  diffcraft: {
    name: "DiffCraft",
    kicker: "Collaborative code review",
    url: "https://github.com/man-singh-dev/diffCraft",
    demo: "https://diffcraft-three.vercel.app",
    pitch: "The diff, the discussion, the decision and the analysis in one workspace. AI findings are suggestions humans verify, never verdicts.",
    stack: ["Next.js", "Fastify", "Drizzle", "PostgreSQL", "Zod", "Vitest", "pnpm monorepo"],
    implemented: ["Auth & database", "Diff ingestion", "Diff viewer", "Approvals & lifecycle"],
    inProgress: ["Line comments & threads", "Workspaces & roles"],
    planned: ["Live sync (Socket.IO)", "AI review (BullMQ → OpenAI)"],
  },
};

/** Short descriptions for repos whose GitHub description is empty (taken from their READMEs). */
export const REPO_DESCRIPTIONS: Record<string, string> = {
  crukx: "Staging repo for the Crukx frontend: a mock-data environment for building and reviewing UI changes.",
  SentinelOps: "Real-time incident intelligence: ingest, deduplicate and correlate events into incidents.",
};

export const SKILLS: { group: string; items: string[] }[] = [
  { group: "Languages", items: ["C++", "Java", "Go", "Python", "TypeScript", "JavaScript", "SQL", "HTML/CSS"] },
  { group: "Web & Backend", items: ["Node.js", "Fastify", "Next.js", "React", "REST APIs", "Socket.IO", "BullMQ"] },
  { group: "Databases", items: ["PostgreSQL", "Redis", "Drizzle ORM"] },
  { group: "AI / ML", items: ["Vision-Language Models", "Video Understanding", "Benchmark Design", "Model Evaluation", "OpenAI API"] },
  { group: "Tools", items: ["Git", "GitHub", "Docker", "Vitest", "Zod"] },
  { group: "Coursework", items: ["DSA", "OOP", "DBMS", "Operating Systems", "Computer Networks"] },
];

export const ACHIEVEMENTS = [
  {
    id: "hack",
    front: "Semi-Finalist",
    sub: "ET Gen AI Hackathon",
    back: "Reached the semi-finals of the Economic Times Gen AI Hackathon.",
  },
  {
    id: "sih",
    front: "SIH",
    sub: "Smart India Hackathon",
    back: "Selected at the institute level for Smart India Hackathon.",
  },
  {
    id: "ecell",
    front: "Lead",
    sub: "Technical & PR Team · E-Cell, NIT Agartala",
    back: "Handled tech and PR for E-Cell events; worked with sponsors, participants and organizing teams on planning and outreach.",
  },
];

export const EDUCATION = [
  {
    title: "B.Tech, Computer Science & Engineering",
    place: "Indian Institute of Information Technology, Agartala",
    period: "2024 – 2028",
    score: "8.82",
    scoreLabel: "CGPA / 10",
  },
  { title: "Class XII", place: "Modern English School, Nawada, Bihar", period: "2023", score: "94.2%", scoreLabel: "" },
  { title: "Class X", place: "Modern English School, Nawada, Bihar", period: "2021", score: "98.6%", scoreLabel: "" },
];
