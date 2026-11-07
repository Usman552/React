// Admin navigation, shared by the sidebar, the breadcrumbs and the command palette.

export const NAV_GROUPS = [
  { label: null, items: [{ to: "/admin", label: "Overview", icon: "dashboard", end: true }] },
  {
    label: "Content",
    items: [
      { to: "/admin/profile", label: "Profile", icon: "user" },
      { to: "/admin/projects", label: "Projects", icon: "folder" },
      { to: "/admin/experience", label: "Experience", icon: "briefcase" },
      { to: "/admin/services", label: "Services", icon: "layers" },
      { to: "/admin/skills", label: "Skills", icon: "sparkles" },
    ],
  },
  { label: "Library", items: [{ to: "/admin/media", label: "Media", icon: "image" }] },
  {
    label: "Connect",
    items: [
      { to: "/admin/github", label: "GitHub", icon: "github" },
      { to: "/admin/messages", label: "Messages", icon: "inbox", badge: "unread" },
    ],
  },
  { label: "System", items: [{ to: "/admin/settings", label: "Settings", icon: "settings" }] },
];

export const NAV_ITEMS = NAV_GROUPS.flatMap((group) => group.items.map((item) => ({ ...item, group: group.label })));

/** { section, title } for the breadcrumb of the current path. */
export function describePath(pathname) {
  if (pathname === "/admin/projects/new") return { section: "Projects", title: "New project", parent: "/admin/projects" };
  if (/^\/admin\/projects\/[^/]+$/.test(pathname)) return { section: "Projects", title: "Edit project", parent: "/admin/projects" };
  const item = [...NAV_ITEMS].reverse().find((i) => (i.end ? pathname === i.to : pathname.startsWith(i.to)));
  if (!item) return { section: null, title: "Not found" };
  return { section: item.group, title: item.label };
}
