/**
 * Built-in portfolio content, in the same shape the database returns.
 *
 * Used in three places:
 *   1. First paint, before the database responds (and if it can't be reached).
 *   2. The site without Supabase configured (plain static build).
 *   3. `npm run db:seed`, which copies this into an empty database once.
 *
 * After seeding, edit content in /admin, not here.
 *
 * Text fields marked "highlight" accept *stars* around the words that should
 * get the gradient, and \n for a line break. No HTML.
 */

export const defaultProfile = {
  name: "Usman Qasim",
  logo_text: "Usman",
  title: "Front-End Developer",
  roles: ["React Developer", "Next.js Developer", "TypeScript Engineer", "API Integration Specialist"],
  hero_badge: "Available for freelance & full-time work",
  // highlight
  hero_heading: "Hi, I'm Usman Qasim —\nI build *fast, modern* web apps.",
  hero_subtitle:
    "Front-End Developer from Multan, Pakistan. I turn designs into production-ready React and Next.js interfaces — typed with TypeScript, wired to real REST APIs, secured with Firebase Authentication, and responsive on every screen.",
  availability_open: true,
  availability_label: "Open to work",
  bio: [
    "I'm **Usman Qasim**, a Front-End Developer based in Multan, Pakistan. I started out writing PHP, Laravel and CodeIgniter backends, which taught me how data actually moves through an application — and that perspective now shapes every interface I build.",
    "Today I work mainly in **React** and **Next.js** with **TypeScript**. I integrate REST APIs with proper loading, empty and error states, secure apps with **Firebase Authentication**, and manage state with Redux Toolkit. Every build ships responsive, keyboard-accessible and with a dark/light theme — because those aren't extras, they're the baseline.",
    "I'm currently completing my BS in Computer Science (graduating 2026) and taking on freelance and remote front-end work.",
  ],
  location: "Multan, Pakistan",
  languages: "English, Urdu",
  photo_url: "/profile.png",
  resume_url: "/resume.pdf",
  show_resume: true,
  // Optional: when set, the About sidebar shows "N+ years".
  experience_years: null,
  email: "usmanaa552@gmail.com",
  response_time: "Usually within 24 hours",
  socials: [
    { label: "GitHub", url: "https://github.com/Usman552" },
    { label: "LinkedIn", url: "https://www.linkedin.com/in/usman-qasim-808326282" },
    // Shows the floating "Chat on WhatsApp" button.
    { label: "WhatsApp", url: "https://wa.me/923060676115" },
  ],
  cta_primary: { label: "View Projects", href: "#projects" },
  cta_secondary: { label: "Get in Touch", href: "#contact" },
  stats: [
    { value: 1, suffix: "+", label: "Years Experience" },
    { value: 10, suffix: "+", label: "Projects Built" },
    { value: 5, suffix: "+", label: "Core Technologies" },
    { value: 2026, suffix: "", label: "Graduating" },
  ],
  quick_facts: [
    { value: "10+", label: "Projects shipped" },
    { value: "100%", label: "Responsive builds" },
    { value: "< 24h", label: "Reply time" },
  ],
  focus: [
    "React & Next.js applications",
    "TypeScript-first codebases",
    "REST API integration",
    "Firebase Auth & Firestore",
    "Responsive, accessible UI",
    "Performance & clean code",
  ],
  hero_stack: ["React", "Next.js", "TypeScript", "Redux Toolkit", "Firebase Auth", "REST APIs", "Tailwind CSS", "Laravel", "MySQL", "Git"],
  hero_tags: ["React", "Next.js", "TypeScript", "Firebase"],
  contact_intro:
    "I'm currently open to freelance projects and full-time front-end roles. Tell me what you're building and what you need from the front end.",
};

export const defaultSettings = {
  site_title: "Usman Qasim — React, Next.js & TypeScript Developer",
  seo_title: "Usman Qasim — React, Next.js & TypeScript Developer",
  seo_description:
    "Front-End Developer from Multan, Pakistan. I build fast, responsive web apps with React, Next.js and TypeScript — REST API integration, Firebase Authentication and clean, accessible UI.",
  seo_keywords:
    "Usman Qasim, React Developer, Next.js Developer, TypeScript, Firebase Auth, API Integration, Front-End Developer Pakistan",
  og_image: "/profile.png",
  favicon_url: null,
  footer_tagline: "Front-End Developer — React, Next.js & TypeScript.\nBuilding fast, accessible interfaces from Multan, Pakistan.",
  footer_note: "Designed & built with Next.js.",
  sections: {
    about: {
      visible: true,
      label: "About Me",
      title: "Developer who cares about *how it feels*, not just how it looks.",
      lead: "",
    },
    services: {
      visible: true,
      label: "What I Do",
      title: "Services built around a *modern front-end stack*.",
      lead: "From a Figma file to a deployed, authenticated, API-connected app — here is where I add the most value.",
    },
    skills: {
      visible: true,
      label: "My Skills",
      title: "The stack I use to *ship real products*.",
      lead: "Grouped by where they sit in the build — interface, data layer, and the tooling that ties them together.",
    },
    experience: {
      visible: true,
      label: "Experience",
      title: "Where I've *worked and learned*.",
      lead: "Roles, education and certifications — newest first.",
    },
    projects: {
      visible: true,
      label: "Projects",
      title: "Selected *work*.",
      lead: "Client builds, full-stack apps and experiments — each one deployed and running.",
    },
    contact: {
      visible: true,
      label: "Contact",
      title: "Let's build *something great*.",
      lead: "Have a project, a role, or just a question? Send a message and I'll get back to you.",
    },
  },
  // Public site appearance: default mode for new visitors, whether they can
  // switch it, and the brand colour preset (see accentThemes in site.js).
  theme: {
    mode: "system",
    allow_toggle: true,
    accent: "aurora",
  },
  project_display: {
    show_filters: true,
    // Projects on the home page before "View all projects".
    initial_count: 6,
    // Demos only: no source-code buttons or GitHub link on the public site.
    show_code_links: false,
    show_github_link: false,
  },
};

export const defaultProjects = [
  {
    slug: "todo-task-manager",
    title: "Todo & Task Manager",
    summary:
      "Task manager with Firebase Authentication, per-user data isolation and grouped lists. State handled with Redux Toolkit, synced to Firestore.",
    details: "",
    features: [],
    category: "Web Apps & Dashboards",
    tech: ["React", "Redux Toolkit", "Firebase"],
    tags: [],
    thumbnail_url: null,
    gallery: [],
    cover: "violet-cyan",
    demo_url: null,
    repo_url: "https://github.com/Usman552",
    featured: true,
    show_on_home: true,
    completed_at: null,
  },
  {
    slug: "zs-perfumes",
    title: "Z&S Perfumes",
    summary:
      "Full e-commerce store on Laravel 10 — product catalog, cart, checkout and an admin panel for managing inventory and orders.",
    details: "",
    features: [],
    category: "E-commerce",
    tech: ["Laravel", "MySQL", "Bootstrap"],
    tags: [],
    thumbnail_url: null,
    gallery: [],
    cover: "pink-violet",
    demo_url: null,
    repo_url: "https://github.com/Usman552",
    featured: true,
    show_on_home: true,
    completed_at: null,
  },
  {
    slug: "nic-and-mia",
    title: "Nic & Mia — By the Seashore",
    summary:
      "Responsive brand site for a children's swimwear label, built around a clean product showcase and fast load on mobile networks.",
    details: "",
    features: [],
    category: "Business Websites",
    tech: ["HTML", "CSS", "JavaScript"],
    tags: [],
    thumbnail_url: null,
    gallery: [],
    cover: "cyan-mint",
    demo_url: null,
    repo_url: null,
    featured: false,
    show_on_home: true,
    completed_at: null,
  },
  {
    slug: "emotion-recognition-from-speech",
    title: "Emotion Recognition from Speech",
    summary:
      "Final Year Project — a machine learning model that classifies emotion from speech audio, served through a simple web interface.",
    details: "",
    features: [],
    category: "AI & ML",
    tech: ["Python", "ML", "Flask"],
    tags: [],
    thumbnail_url: null,
    gallery: [],
    cover: "mint-violet",
    demo_url: null,
    repo_url: null,
    featured: false,
    show_on_home: true,
    completed_at: null,
  },
];

export const defaultServices = [
  {
    icon: "◆",
    title: "React & Next.js Development",
    description:
      "Single-page apps and server-rendered Next.js sites built from reusable components, with routing, SEO metadata and clean, typed code.",
    tags: ["React", "Next.js", "TypeScript"],
  },
  {
    icon: "◈",
    title: "API Integration",
    description:
      "Connecting the frontend to any REST API — auth headers, pagination, caching, loading and error states handled properly instead of an afterthought.",
    tags: ["REST", "Axios", "React Query"],
  },
  {
    icon: "◉",
    title: "Firebase Authentication",
    description:
      "Full auth flows: email/password and Google sign-in, protected routes, session persistence and per-user data rules in Firestore.",
    tags: ["Firebase Auth", "Firestore", "Rules"],
  },
  {
    icon: "◇",
    title: "Responsive UI Engineering",
    description:
      "Interfaces that hold up from a 320px phone to an ultrawide monitor, with accessible markup, dark/light theming and smooth motion.",
    tags: ["CSS", "Tailwind", "A11y"],
  },
  {
    icon: "✦",
    title: "3D & Interactive Websites",
    description:
      "Immersive, scroll-driven experiences with Three.js and React Three Fiber — 3D scenes, GSAP storytelling and smooth motion that still loads fast on a phone.",
    tags: ["Three.js", "React Three Fiber", "GSAP"],
  },
  {
    icon: "▲",
    title: "E-commerce Development",
    description:
      "Online stores built to sell: product catalogues with filters, cart and checkout, plus an admin panel for products, stock and orders.",
    tags: ["Next.js", "Laravel", "MySQL"],
  },
  {
    icon: "■",
    title: "Admin Dashboards & CMS",
    description:
      "Secure dashboards and content systems with role-based access, data tables, uploads and clear metrics — so you can run your business without touching code.",
    tags: ["React", "Supabase", "Laravel"],
  },
  {
    icon: "★",
    title: "Business & Landing Websites",
    description:
      "Premium sites for hotels, clinics, restaurants and agencies — fast, SEO-ready and designed to turn visitors into enquiries.",
    tags: ["Next.js", "SEO", "GSAP"],
  },
];

export const defaultSkillCategories = [
  {
    title: "Frontend Engineering",
    blurb: "Component architecture, state management and pixel-accurate UI.",
    accent: "violet",
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
    accent: "cyan",
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
    accent: "pink",
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

/** The full public content object, identical in shape to get_public_content(). */
export const defaultContent = {
  profile: defaultProfile,
  settings: defaultSettings,
  projects: defaultProjects.map((p, i) => ({ id: `default-${i}`, ...p })),
  services: defaultServices.map((s, i) => ({ id: `default-${i}`, ...s })),
  skill_categories: defaultSkillCategories.map((c, i) => ({
    id: `default-${i}`,
    ...c,
    skills: c.skills.map((s, j) => ({ id: `default-${i}-${j}`, ...s })),
  })),
  // Filled in from Admin → Experience; the section stays hidden while empty.
  experience: [],
};
