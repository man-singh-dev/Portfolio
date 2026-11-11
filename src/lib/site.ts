export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

/** Prefix a /public asset with the deploy base path (GitHub Pages project sites). */
export const asset = (p: string) => `${BASE_PATH}${p.startsWith("/") ? p : `/${p}`}`;

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const PROFILE = {
  name: "Man Singh",
  short: "MS",
  tagline: "systems + vision",
  email: "maansimaan02@gmail.com",
  location: "Agartala, India",
  roles: ["Backend Engineer", "AI/ML Researcher", "Competitive Programmer"],
  description:
    "Man Singh: CSE undergrad at IIIT Agartala building reliable backend systems and researching whether Vision-Language Models really reason about football tactics.",
  links: {
    github: "https://github.com/man-singh-dev",
    linkedin: "https://www.linkedin.com/in/maansingh0103/",
    leetcode: "https://leetcode.com/u/Mansingh876/",
    codeforces: "https://codeforces.com/profile/maansimaan02",
    resume: "/Man_Singh_Resume.pdf",
  },
} as const;

export const SECTIONS = [
  { id: "top", label: "Home", key: "h" },
  { id: "experience", label: "Experience", key: "e" },
  { id: "projects", label: "Projects", key: "p" },
  { id: "open-source", label: "Open Source", key: "o" },
  { id: "stack", label: "Stack", key: "s" },
  { id: "cp", label: "Competitive", key: "c" },
  { id: "activity", label: "Activity", key: "a" },
  { id: "achievements", label: "Achievements", key: "w" },
  { id: "education", label: "Education", key: "d" },
  { id: "contact", label: "Contact", key: "m" },
] as const;
