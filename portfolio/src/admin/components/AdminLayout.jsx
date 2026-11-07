import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router";
import { useAuth } from "../context/hooks";
import { supabase } from "../lib/supabase";
import CommandPalette from "./CommandPalette";
import Icon from "./Icon";
import { describePath, NAV_GROUPS } from "./nav";
import ThemeSwitch from "./ThemeSwitch";

const COLLAPSE_KEY = "portfolio-admin-sidebar";

async function countUnread() {
  const { count } = await supabase
    .from("contact_messages")
    .select("id", { count: "exact", head: true })
    .eq("status", "unread");
  return count ?? 0;
}

/** Unread badge: refreshed on navigation and when the inbox reports a change. */
function useUnreadCount(pathname) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let active = true;
    const refresh = () => countUnread().then((n) => active && setCount(n));
    refresh();
    window.addEventListener("admin:messages-changed", refresh);
    return () => {
      active = false;
      window.removeEventListener("admin:messages-changed", refresh);
    };
  }, [pathname]);

  return count;
}

/** Name and photo from the profile, for the sidebar's user card. */
function useOwner() {
  const [owner, setOwner] = useState(null);
  useEffect(() => {
    let active = true;
    supabase
      .from("profile")
      .select("name, photo_url")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => active && setOwner(data));
    return () => {
      active = false;
    };
  }, []);
  return owner;
}

function isMac() {
  return typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
}

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const { pathname } = useLocation();
  const unread = useUnreadCount(pathname);
  const owner = useOwner();
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === "1");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const crumbs = describePath(pathname);
  const name = owner?.name || user?.email?.split("@")[0] || "Admin";

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? "1" : "0");
  }, [collapsed]);

  // Ctrl/⌘ + K opens the command palette from anywhere.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the mobile drawer whenever the route changes.
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMobileOpen(false);
  }

  return (
    <div className={`admin ${collapsed ? "is-collapsed" : ""} ${mobileOpen ? "is-mobile-open" : ""}`}>
      <a href="#admin-main" className="skip">
        Skip to content
      </a>

      <aside className="sidebar" aria-label="Admin navigation">
        <Link to="/admin" className="sidebar__brand" title={collapsed ? "Portfolio Studio" : undefined}>
          <span className="sidebar__logo" aria-hidden="true">
            {name.slice(0, 1).toUpperCase()}
          </span>
          <span className="sidebar__title">
            <span className="sidebar__name">Portfolio Studio</span>
            <span className="sidebar__tag">Content & insights</span>
          </span>
        </Link>

        <nav className="sidebar__nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label ?? "main"} className="sidebar__group">
              {group.label && <p className="sidebar__group-label">{group.label}</p>}
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => `sidebar__link ${isActive ? "is-active" : ""}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon name={item.icon} />
                  <span className="sidebar__label">{item.label}</span>
                  {item.badge === "unread" && unread > 0 && (
                    <span className="sidebar__badge" aria-label={`${unread} unread`}>
                      {unread > 99 ? "99+" : unread}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar__foot">
          <button
            type="button"
            className="sidebar__collapse"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            <Icon name="collapse" />
            <span className="sidebar__label">Collapse</span>
          </button>
          <div className="user-card">
            <span className="user-card__avatar" aria-hidden="true">
              {owner?.photo_url ? <img src={owner.photo_url} alt="" /> : name.slice(0, 1).toUpperCase()}
            </span>
            <span className="user-card__meta">
              <span className="user-card__name">{name}</span>
              <span className="user-card__email" title={user?.email}>
                {user?.email}
              </span>
            </span>
            <button type="button" className="icon-btn" onClick={signOut} aria-label="Sign out" title="Sign out">
              <Icon name="logout" size={16} />
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen && <div className="scrim" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <div className="admin__main">
        <header className="topbar">
          <button
            type="button"
            className="icon-btn topbar__menu"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Icon name="menu" />
          </button>

          <nav className="crumbs" aria-label="Breadcrumb">
            {crumbs.section && (
              <>
                {crumbs.parent ? (
                  <Link to={crumbs.parent} className="crumbs__section">
                    {crumbs.section}
                  </Link>
                ) : (
                  <span className="crumbs__section">{crumbs.section}</span>
                )}
                <Icon name="chevronRight" size={13} className="crumbs__sep" />
              </>
            )}
            <span className="crumbs__current" aria-current="page">
              {crumbs.title}
            </span>
          </nav>

          <div className="topbar__spacer" />

          <button type="button" className="cmdk-trigger" onClick={() => setPaletteOpen(true)} aria-label="Search or jump to (Ctrl+K)">
            <Icon name="search" size={15} />
            <span>Search or jump to…</span>
            <kbd>{isMac() ? "⌘" : "Ctrl"}</kbd>
            <kbd>K</kbd>
          </button>
          <ThemeSwitch />
          <a className="a-btn a-btn--ghost a-btn--sm topbar__site" href="/" target="_blank" rel="noreferrer">
            <Icon name="external" size={14} /> <span>View site</span>
          </a>
        </header>

        <main id="admin-main" className="admin__content" tabIndex={-1}>
          {/* Re-keyed per route so every page enters with the same subtle motion. */}
          <div key={pathname} className="admin__page">
            <Outlet />
          </div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
