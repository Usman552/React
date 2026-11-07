import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminThemeContext } from "./hooks";

// The admin's light/dark choice, separate from the public site's theme.
// "system" follows the OS and keeps following it while the admin is open.
// The layout script applies the stored choice before first paint.

const STORAGE_KEY = "portfolio-admin-theme";
const PREFERENCES = ["light", "dark", "system"];

function readPreference() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return PREFERENCES.includes(saved) ? saved : "system";
  } catch {
    return "system";
  }
}

const systemTheme = () => (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");

export default function AdminThemeProvider({ children }) {
  const [preference, setPreferenceState] = useState(readPreference);
  const [system, setSystem] = useState(systemTheme);
  const resolved = preference === "system" ? system : preference;

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => setSystem(systemTheme());
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-admin-theme", resolved);
  }, [resolved]);

  const setPreference = useCallback((next) => {
    setPreferenceState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Private mode: the choice lasts for this visit only.
    }
  }, []);

  const toggle = useCallback(() => setPreference(resolved === "dark" ? "light" : "dark"), [resolved, setPreference]);

  const value = useMemo(() => ({ preference, resolved, setPreference, toggle }), [preference, resolved, setPreference, toggle]);
  return <AdminThemeContext.Provider value={value}>{children}</AdminThemeContext.Provider>;
}
