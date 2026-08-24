import { createContext, useContext } from "react";

export const STORAGE_KEY = "portfolio-theme";

export const ThemeContext = createContext(null);

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside a ThemeProvider");
  return ctx;
}
