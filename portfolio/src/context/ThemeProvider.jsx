"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { STORAGE_KEY, ThemeContext } from "./theme";

// The <html data-theme> attribute is the source of truth. An inline script in
// the root layout sets it before first paint; this provider only reads and
// updates it, so server and client render the same markup.

const listeners = new Set();

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function readTheme() {
  return document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
}

function applyTheme(theme, persist) {
  document.documentElement.setAttribute("data-theme", theme);
  if (persist) window.localStorage.setItem(STORAGE_KEY, theme);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", theme === "dark" ? "#0a0d17" : "#f4f6fc");
  listeners.forEach((listener) => listener());
}

export default function ThemeProvider({ mode = "system", allowToggle = true, children }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "dark");

  // Follow the OS only when the default is "system" and the visitor has not
  // made an explicit choice (or isn't allowed to).
  useEffect(() => {
    if (mode !== "system") return undefined;
    if (allowToggle && window.localStorage.getItem(STORAGE_KEY)) return undefined;
    const media = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = (e) => applyTheme(e.matches ? "light" : "dark", false);
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [mode, allowToggle]);

  const toggleTheme = useCallback(() => {
    if (allowToggle) applyTheme(readTheme() === "dark" ? "light" : "dark", true);
  }, [allowToggle]);
  const value = useMemo(() => ({ theme, toggleTheme, allowToggle }), [theme, toggleTheme, allowToggle]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
