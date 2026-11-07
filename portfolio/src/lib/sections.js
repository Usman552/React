import { navLinks } from "../data/site.js";

/**
 * Home page sections to show, in order: switched on in Admin → Settings and
 * with something to display. Shared by the page and the menu so they match.
 */
export function visibleSections({ settings, services, skill_categories, experience }) {
  const hasContent = {
    services: services.length > 0,
    skills: skill_categories.length > 0,
    experience: (experience || []).length > 0,
  };
  return navLinks.filter((link) => settings.sections[link.id]?.visible !== false && hasContent[link.id] !== false);
}
