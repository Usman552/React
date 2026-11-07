// Project categories describe what kind of site a project is, so visitors
// can browse by type. Shared by the GitHub importer and the admin editor.

export const PROJECT_CATEGORIES = [
  "3D Websites",
  "E-commerce",
  "Business Websites",
  "Web Apps & Dashboards",
  "AI & ML",
];

export const DEFAULT_CATEGORY = "Web Apps & Dashboards";

// Checked in order; the first match wins. Text is normalised so "-" and "_"
// become spaces before matching ("real-estate" → "real estate").
const RULES = [
  ["3D Websites", /\b3d\b|three ?\.?js|webgl|react three|\br3f\b/i],
  ["AI & ML", /machine learning|deep learning|\bml\b|\bai\b|tensorflow|pytorch|emotion (detection|recognition)|neural/i],
  ["Web Apps & Dashboards", /\badmin\b|dashboard|management system|\bcrm\b|\berp\b|job portal|todo|task manager/i],
  ["E-commerce", /\be ?commerce|storefront|\bshop\b|\bstore\b|checkout|\bcart\b/i],
  [
    "Business Websites",
    /hotel|restaurant|resturent|patisserie|\bcafe\b|clinic|hospital|real ?estate|realestate|\bgym\b|fitness|agency|landing page|furniture|brand site/i,
  ],
];

/** Guesses a category from any text that describes the project. */
export function guessCategoryFromText(...parts) {
  const text = parts.flat().filter(Boolean).join(" ").replace(/[-_]/g, " ");
  const hit = RULES.find(([, pattern]) => pattern.test(text));
  return hit ? hit[0] : DEFAULT_CATEGORY;
}
