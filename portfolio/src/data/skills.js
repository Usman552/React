export const skillGroups = [
  {
    title: "Frontend Engineering",
    blurb: "Component architecture, state management and pixel-accurate UI.",
    accent: "var(--violet)",
    skills: [
      { name: "React", level: 90 },
      { name: "Next.js", level: 82 },
      { name: "TypeScript", level: 80 },
      { name: "JavaScript (ES6+)", level: 88 },
      { name: "Redux Toolkit", level: 82 },
      { name: "HTML5 & CSS3", level: 95 },
    ],
  },
  {
    title: "Backend & Data",
    blurb: "APIs, authentication and the database layer behind the interface.",
    accent: "var(--cyan)",
    skills: [
      { name: "REST API Integration", level: 88 },
      { name: "Firebase Auth", level: 85 },
      { name: "Cloud Firestore", level: 82 },
      { name: "Laravel", level: 85 },
      { name: "PHP", level: 80 },
      { name: "MySQL", level: 80 },
    ],
  },
  {
    title: "Tooling & Workflow",
    blurb: "The everyday stack that keeps shipping fast and predictable.",
    accent: "var(--pink)",
    skills: [
      { name: "Git & GitHub", level: 88 },
      { name: "Vite", level: 85 },
      { name: "Firebase Hosting", level: 85 },
      { name: "Tailwind & Bootstrap", level: 88 },
      { name: "Postman", level: 82 },
      { name: "Figma to Code", level: 85 },
    ],
  },
];

export const services = [
  {
    icon: "◆",
    title: "React & Next.js Development",
    text: "Single-page apps and server-rendered Next.js sites built from reusable components, with routing, SEO metadata and clean, typed code.",
    tags: ["React", "Next.js", "TypeScript"],
  },
  {
    icon: "◈",
    title: "API Integration",
    text: "Connecting the frontend to any REST API — auth headers, pagination, caching, loading and error states handled properly instead of an afterthought.",
    tags: ["REST", "Axios", "React Query"],
  },
  {
    icon: "◉",
    title: "Firebase Authentication",
    text: "Full auth flows: email/password and Google sign-in, protected routes, session persistence and per-user data rules in Firestore.",
    tags: ["Firebase Auth", "Firestore", "Rules"],
  },
  {
    icon: "◇",
    title: "Responsive UI Engineering",
    text: "Interfaces that hold up from a 320px phone to an ultrawide monitor, with accessible markup, dark/light theming and smooth motion.",
    tags: ["CSS", "Tailwind", "A11y"],
  },
];
