/**
 * ADD YOUR PROJECTS HERE.
 *
 *   demo     -> Firebase Hosting ka live link (e.g. "https://my-app.web.app").
 *               "#" rakha to card par "Demo soon" dikhega, dead link nahi banega.
 *   github   -> repo link, ya `null` agar repo private hai (button hide ho jayega).
 *   image    -> screenshot "public/shots/" me rakh kar "/shots/app.png" likhein.
 *               null rakha to gradient cover show hoga.
 *   category -> "React" | "Next.js" | "Laravel" | "Other"  (filter tabs ke liye)
 *   tech     -> 3-4 se zyada na rakhein, card compact rehta hai.
 */

export const categories = ["All", "React", "Next.js", "Laravel", "Other"];

export const projects = [
  {
    title: "Todo & Task Manager",
    category: "React",
    featured: true,
    description:
      "Task manager with Firebase Authentication, per-user data isolation and grouped lists. State handled with Redux Toolkit, synced to Firestore.",
    tech: ["React", "Redux Toolkit", "Firebase"],
    image: null,
    gradient: "linear-gradient(135deg, #7c5cff, #38dfff)",
    demo: "#",
    github: "https://github.com/Usman552",
  },
  {
    title: "Z&S Perfumes",
    category: "Laravel",
    featured: true,
    description:
      "Full e-commerce store on Laravel 10 — product catalog, cart, checkout and an admin panel for managing inventory and orders.",
    tech: ["Laravel", "MySQL", "Bootstrap"],
    image: null,
    gradient: "linear-gradient(135deg, #ff5cad, #7c5cff)",
    demo: "#",
    github: "https://github.com/Usman552",
  },
  {
    title: "Nic & Mia — By the Seashore",
    category: "Other",
    featured: false,
    description:
      "Responsive brand site for a children's swimwear label, built around a clean product showcase and fast load on mobile networks.",
    tech: ["HTML", "CSS", "JavaScript"],
    image: null,
    gradient: "linear-gradient(135deg, #38dfff, #35e8c3)",
    demo: "#",
    github: null,
  },
  {
    title: "Emotion Recognition from Speech",
    category: "Other",
    featured: false,
    description:
      "Final Year Project — a machine learning model that classifies emotion from speech audio, served through a simple web interface.",
    tech: ["Python", "ML", "Flask"],
    image: null,
    gradient: "linear-gradient(135deg, #35e8c3, #7c5cff)",
    demo: "#",
    github: null,
  },
];
