/** Page structure. Section copy and visibility are managed in /admin → Settings. */
// Order of the home page sections and the menu: work first.
export const navLinks = [
  { id: "projects", label: "Work" },
  { id: "services", label: "Services" },
  { id: "about", label: "About" },
  { id: "experience", label: "Experience" },
  { id: "skills", label: "Stack" },
  { id: "contact", label: "Contact" },
];

/** Cover gradients a project can use when it has no thumbnail. */
export const coverGradients = {
  "violet-cyan": "linear-gradient(135deg, #7c5cff, #38dfff)",
  "pink-violet": "linear-gradient(135deg, #ff5cad, #7c5cff)",
  "cyan-mint": "linear-gradient(135deg, #38dfff, #35e8c3)",
  "mint-violet": "linear-gradient(135deg, #35e8c3, #7c5cff)",
  "cyan-violet": "linear-gradient(135deg, #38dfff, #7c5cff)",
};

export const accentColors = {
  violet: "var(--violet)",
  cyan: "var(--cyan)",
  pink: "var(--pink)",
  mint: "var(--mint)",
};

/**
 * Brand colour presets for the public site (Admin → Settings → Appearance).
 * `primary` replaces --violet and `secondary` replaces --cyan, so every
 * gradient, glow and accent follows. index.css holds the same values.
 */
export const accentThemes = {
  aurora: { label: "Aurora", primary: "#8b6cff", secondary: "#45d6ff" },
  ocean: { label: "Ocean", primary: "#3d8bff", secondary: "#2fd4c4" },
  sunset: { label: "Sunset", primary: "#ff7a59", secondary: "#ffc043" },
  rose: { label: "Rose", primary: "#ff5c93", secondary: "#b67cff" },
  emerald: { label: "Emerald", primary: "#22c58b", secondary: "#9be15d" },
};

export const THEME_MODES = ["system", "dark", "light"];
