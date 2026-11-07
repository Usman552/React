export function projectPath(project) {
  return `/projects/${encodeURIComponent(project.slug)}`;
}

export function categoryPath(category) {
  return `/projects?category=${encodeURIComponent(category)}`;
}

export function yearOf(date) {
  return date ? String(date).slice(0, 4) : null;
}

/** Categories in the order projects first use them, with counts. */
export function categoryCounts(projects) {
  const counts = new Map();
  for (const project of projects) {
    if (project.category) counts.set(project.category, (counts.get(project.category) || 0) + 1);
  }
  return [...counts].map(([name, count]) => ({ name, count }));
}
