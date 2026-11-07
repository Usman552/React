// Skill suggestions from GitHub. Plain JS so the admin and the Node tests
// share it, like github.js.
//
// Every technology found in the synced repositories (README tech section,
// language breakdown, topics) is reduced to one canonical name, so
// "React 19", "react" and "React context" all count as "React". Only
// technologies in the catalogue below are suggested: unknown phrases from
// READMEs ("Unsplash photos") are dropped rather than shown as noise.
//
// A suggestion is hidden when an existing skill already covers it (skills
// such as "HTML5 & CSS3" cover both HTML and CSS) or when the admin
// dismissed it.

import { mainLanguages } from "./github.js";

/** Where a skill belongs. `match` finds an existing category for the group. */
export const SKILL_GROUPS = {
  frontend: {
    label: "Frontend",
    title: "Frontend Development",
    accent: "violet",
    match: /front|\bui\b|interface|client/i,
  },
  backend: { label: "Backend", title: "Backend Development", accent: "cyan", match: /back|server|\bapis?\b/i },
  database: { label: "Database", title: "Databases", accent: "mint", match: /data|\bdbs?\b|storage/i },
  testing: { label: "Testing", title: "Testing & QA", accent: "pink", match: /test|\bqa\b|quality/i },
  devops: {
    label: "DevOps",
    title: "DevOps & Deployment",
    accent: "cyan",
    match: /devops|deploy|cloud|infra|hosting|\bops\b|ci\s*\/\s*cd/i,
  },
  tools: { label: "Tools", title: "Tools & Workflow", accent: "mint", match: /tool|workflow|productivity/i },
  ai: { label: "AI / ML", title: "AI & Machine Learning", accent: "pink", match: /\bai\b|machine|\bml\b|intelligence/i },
};

// [canonical name, group, ...aliases]. Aliases are lowercase.
const CATALOGUE = [
  // Frontend
  ["HTML", "frontend", "html5", "plain html", "semantic html"],
  ["CSS", "frontend", "css3"],
  ["JavaScript", "frontend", "js", "es6", "vanilla js", "vanilla javascript"],
  ["TypeScript", "frontend", "ts"],
  ["React", "frontend", "reactjs", "react.js", "react-js"],
  ["Next.js", "frontend", "nextjs", "next", "next-js"],
  ["Vue", "frontend", "vue.js", "vuejs"],
  ["Nuxt", "frontend", "nuxt.js", "nuxtjs"],
  ["Angular", "frontend", "angularjs"],
  ["Svelte", "frontend", "sveltekit"],
  ["Astro", "frontend"],
  ["Remix", "frontend"],
  ["Tailwind CSS", "frontend", "tailwind", "tailwindcss"],
  ["Bootstrap", "frontend"],
  ["Sass", "frontend", "scss"],
  ["CSS Modules", "frontend"],
  ["Styled Components", "frontend", "styled-components"],
  ["Material UI", "frontend", "mui", "material-ui"],
  ["Chakra UI", "frontend"],
  ["shadcn/ui", "frontend", "shadcn"],
  ["Redux Toolkit", "frontend", "redux-toolkit", "rtk", "redux"],
  ["Zustand", "frontend"],
  ["TanStack Query", "frontend", "react query", "react-query", "tanstack"],
  ["React Router", "frontend", "react-router"],
  ["Framer Motion", "frontend", "framer-motion", "motion"],
  ["GSAP", "frontend", "scrolltrigger", "gsap scrolltrigger"],
  ["Three.js", "frontend", "threejs", "three-js", "three"],
  ["React Three Fiber", "frontend", "@react-three/fiber", "r3f", "react-three-fiber", "@react-three/drei", "drei"],
  ["WebGL", "frontend"],
  ["Lenis", "frontend"],
  ["jQuery", "frontend", "jquery"],
  ["Alpine.js", "frontend", "alpine", "alpinejs"],
  ["Chart.js", "frontend", "chartjs"],
  ["Recharts", "frontend"],
  ["D3.js", "frontend", "d3"],
  ["Swiper", "frontend", "swiper.js"],
  ["Font Awesome", "frontend", "fontawesome"],
  ["Vite", "tools", "vitejs"],
  // Backend
  ["Node.js", "backend", "node", "nodejs"],
  ["Express", "backend", "express.js", "expressjs"],
  ["NestJS", "backend", "nest.js", "nest"],
  ["PHP", "backend"],
  ["Laravel", "backend"],
  ["Blade", "backend", "laravel blade", "blade templates"],
  ["CodeIgniter", "backend", "codeigniter 4"],
  ["Python", "backend"],
  ["Django", "backend"],
  ["Flask", "backend"],
  ["FastAPI", "backend"],
  ["Java", "backend"],
  ["Spring Boot", "backend", "spring"],
  ["Go", "backend", "golang"],
  ["Rust", "backend"],
  ["Ruby on Rails", "backend", "rails", "ruby"],
  ["C#", "backend", ".net", "dotnet", "asp.net"],
  ["GraphQL", "backend"],
  ["REST APIs", "backend", "rest", "rest api", "restful api", "rest api integration"],
  ["Socket.IO", "backend", "socket.io", "socketio", "websockets", "websocket"],
  ["Firebase", "backend", "firebase auth", "firebase authentication"],
  ["Supabase", "backend"],
  ["Stripe", "backend"],
  ["JWT", "backend", "json web tokens"],
  // Databases
  ["MySQL", "database"],
  ["PostgreSQL", "database", "postgres", "postgresql"],
  ["MongoDB", "database", "mongo"],
  ["Mongoose", "database"],
  ["SQLite", "database"],
  ["Redis", "database"],
  ["Prisma", "database"],
  ["Drizzle ORM", "database", "drizzle"],
  ["Cloud Firestore", "database", "firestore"],
  ["SQL", "database"],
  // Testing
  ["Jest", "testing"],
  ["Vitest", "testing"],
  ["Cypress", "testing"],
  ["Playwright", "testing"],
  ["Testing Library", "testing", "react testing library", "@testing-library/react"],
  ["Mocha", "testing"],
  ["PHPUnit", "testing"],
  ["Pytest", "testing"],
  // DevOps
  ["Docker", "devops", "dockerfile", "docker compose"],
  ["Kubernetes", "devops", "k8s"],
  ["GitHub Actions", "devops", "github-actions"],
  ["GitHub Pages", "devops", "gh-pages"],
  ["Vercel", "devops"],
  ["Netlify", "devops"],
  ["Firebase Hosting", "devops"],
  ["AWS", "devops", "amazon web services"],
  ["Google Cloud", "devops", "gcp"],
  ["Cloudflare", "devops", "cloudflare pages"],
  ["Nginx", "devops"],
  ["CI/CD", "devops"],
  // Tools
  ["Git", "tools"],
  ["GitHub", "tools"],
  ["npm", "tools"],
  ["ESLint", "tools"],
  ["Prettier", "tools"],
  ["Webpack", "tools"],
  ["Figma", "tools", "figma to code"],
  ["Postman", "tools"],
  ["Storybook", "tools"],
  ["Shell", "tools", "bash", "shell scripting"],
  ["Jupyter", "ai", "jupyter notebook"],
  // AI / ML
  ["Machine Learning", "ai", "machine-learning", "ml"],
  ["Deep Learning", "ai", "deep-learning"],
  ["TensorFlow", "ai"],
  ["PyTorch", "ai"],
  ["Keras", "ai"],
  ["scikit-learn", "ai", "sklearn"],
  ["OpenCV", "ai"],
  ["Pandas", "ai"],
  ["NumPy", "ai"],
  ["OpenAI API", "ai", "openai"],
];

const BY_ALIAS = new Map();
for (const [name, group, ...aliases] of CATALOGUE) {
  const entry = { name, group, key: name.toLowerCase() };
  for (const alias of [name.toLowerCase(), ...aliases]) BY_ALIAS.set(alias, entry);
}

const VERSION = /\s+v?\d[\d.x]*\+?$/i;

function clean(value) {
  return String(value || "")
    .replace(/\([^)]*\)?/g, " ") // "(ES6+)", and a stray "(" cut off by the README parser
    .replace(/[()]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function stripVersion(text) {
  let out = text;
  while (VERSION.test(out)) out = out.replace(VERSION, "");
  return out;
}

/**
 * Canonical catalogue entry for a technology name, or null if unknown.
 * Tries the whole phrase, then shorter leading phrases, so
 * "Laravel session auth" → Laravel and "Bootstrap 5 grid" → Bootstrap.
 */
export function canonicalTech(value) {
  const words = clean(value).split(" ").filter(Boolean);
  for (let n = words.length; n > 0; n -= 1) {
    const phrase = stripVersion(words.slice(0, n).join(" "));
    const hit = BY_ALIAS.get(phrase);
    if (hit) return hit;
  }
  return null;
}

/** Canonical keys an existing skill covers: "HTML5 & CSS3" → html, css. */
export function coveredKeys(skillName) {
  const keys = new Set();
  const parts = String(skillName || "").split(/\s*(?:&|\/|,|\+|\band\b)\s*/i);
  for (const part of [skillName, ...parts]) {
    const hit = canonicalTech(part);
    if (hit) keys.add(hit.key);
  }
  return keys;
}

/** Every technology name a repository mentions, before canonicalising. */
function repoMentions(repo) {
  return [
    ...(repo.readme_tech || []),
    ...mainLanguages(repo.languages),
    ...(repo.language ? [repo.language] : []),
    ...(repo.topics || []),
    ...(repo.readme_topics || []),
  ];
}

/**
 * Technologies used across `repos` that aren't skills yet.
 *   repos      github_repos rows
 *   skills     [{ name }] existing skills
 *   dismissed  [{ key }] or keys the admin chose to hide
 * Returns [{ key, name, group, count, repos: [repo name] }], most used first.
 */
export function discoverSkills({ repos = [], skills = [], dismissed = [] }) {
  const covered = new Set(skills.flatMap((s) => [...coveredKeys(s.name)]));
  const hidden = new Set(dismissed.map((d) => (typeof d === "string" ? d : d.key)));
  const found = new Map();

  for (const repo of repos) {
    if (repo.state === "missing") continue;
    const seen = new Set();
    for (const mention of repoMentions(repo)) {
      const hit = canonicalTech(mention);
      if (!hit || seen.has(hit.key)) continue;
      seen.add(hit.key);
      const entry = found.get(hit.key) || { ...hit, count: 0, repos: [] };
      entry.count += 1;
      entry.repos.push(repo.readme_title || repo.name);
      found.set(hit.key, entry);
    }
  }

  return [...found.values()]
    .filter((s) => !covered.has(s.key) && !hidden.has(s.key))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

/** The existing category a group's skills should go in, or null. */
export function matchCategory(group, categories = []) {
  const pattern = SKILL_GROUPS[group]?.match;
  if (!pattern) return null;
  return categories.find((c) => pattern.test(c.title)) || null;
}
