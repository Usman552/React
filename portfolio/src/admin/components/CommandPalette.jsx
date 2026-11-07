import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { useAdminTheme, useAuth } from "../context/hooks";
import Icon from "./Icon";
import { NAV_ITEMS } from "./nav";

/** Every command, grouped. `run` gets { navigate, theme, signOut }. */
function buildCommands() {
  const go = (to) => ({ navigate }) => navigate(to);
  return [
    ...NAV_ITEMS.map((item) => ({ id: item.to, group: "Go to", label: item.label, icon: item.icon, run: go(item.to) })),
    { id: "new-project", group: "Create", label: "New project", icon: "plus", run: go("/admin/projects/new") },
    { id: "new-experience", group: "Create", label: "Add experience", icon: "briefcase", run: go("/admin/experience?new=1") },
    { id: "capture", group: "Create", label: "Capture a website screenshot", icon: "camera", run: go("/admin/media?capture=1") },
    { id: "discover", group: "Create", label: "Discover skills from GitHub", icon: "wand", run: go("/admin/skills") },
    {
      id: "theme",
      group: "Preferences",
      label: "Toggle light / dark theme",
      icon: "sun",
      keepOpen: true,
      run: ({ theme }) => theme.toggle(),
    },
    { id: "site", group: "Preferences", label: "Open live site", icon: "external", run: () => window.open("/", "_blank", "noopener") },
    { id: "signout", group: "Preferences", label: "Sign out", icon: "logout", run: ({ signOut }) => signOut() },
  ];
}

const COMMANDS = buildCommands();

export default function CommandPalette({ open, onClose }) {
  const ref = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();
  const theme = useAdminTheme();
  const { signOut } = useAuth();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) => `${c.label} ${c.group}`.toLowerCase().includes(q));
  }, [query]);

  // Reset the selection whenever the result list changes.
  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setActive(0);
  }

  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const close = () => {
    setQuery("");
    onClose();
  };

  const run = (command) => {
    if (!command) return;
    command.run({ navigate, theme, signOut });
    if (!command.keepOpen) close();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      run(results[active]);
    }
  };

  return (
    <dialog
      ref={ref}
      className="cmdk"
      aria-label="Command palette"
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      onClick={(e) => e.target === ref.current && close()}
    >
      {open && (
        <>
          <div className="cmdk__search">
            <Icon name="search" size={18} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Search pages and actions…"
              aria-label="Search pages and actions"
              role="combobox"
              aria-expanded="true"
              aria-controls="cmdk-list"
              aria-activedescendant={results[active] ? `cmdk-${results[active].id}` : undefined}
            />
            <kbd>esc</kbd>
          </div>
          <ul ref={listRef} id="cmdk-list" className="cmdk__list" role="listbox">
            {results.length === 0 && <li className="cmdk__empty">No results for “{query}”</li>}
            {results.map((command, i) => {
              const header = command.group !== results[i - 1]?.group ? command.group : null;
              return (
                <li key={command.id} role="presentation">
                  {header && <p className="cmdk__group">{header}</p>}
                  <button
                    id={`cmdk-${command.id}`}
                    type="button"
                    role="option"
                    aria-selected={i === active}
                    className="cmdk__item"
                    onMouseMove={() => setActive(i)}
                    onClick={() => run(command)}
                  >
                    <Icon name={command.icon} size={17} />
                    <span>{command.label}</span>
                    {i === active && <Icon name="chevronRight" size={14} />}
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="cmdk__foot">
            <span>
              <kbd>↑</kbd>
              <kbd>↓</kbd> navigate
            </span>
            <span>
              <kbd>↵</kbd> open
            </span>
            <span>
              <kbd>esc</kbd> close
            </span>
          </div>
        </>
      )}
    </dialog>
  );
}
