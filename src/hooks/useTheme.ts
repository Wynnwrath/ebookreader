import { useState, useEffect, useCallback } from "react";

const VALID_THEMES = ["scholarly-dark", "scholarly-light", "scholarly-sepia"] as const;
type AppTheme = (typeof VALID_THEMES)[number];

/**
 * Manages the app-level theme (scholarly-dark / scholarly-light / scholarly-sepia).
 * Handles DOM classList manipulation and localStorage persistence.
 * Replaces duplicated theme logic in RootLayout, SettingsModal, and ProfilePage.
 */
export function useTheme() {
  const [activeTheme, setActiveTheme] = useState<AppTheme>("scholarly-dark");

  // Initialize from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("stellaron-theme") || "scholarly-dark";
    const normalized = normalizeTheme(savedTheme);
    setActiveTheme(normalized);
    applyThemeToDOM(normalized);
  }, []);

  const setTheme = useCallback((theme: string) => {
    const normalized = normalizeTheme(theme);
    setActiveTheme(normalized);
    localStorage.setItem("stellaron-theme", normalized);
    applyThemeToDOM(normalized);
  }, []);

  const toggleTheme = useCallback(() => {
    setActiveTheme((prev) => {
      let next: AppTheme;
      if (prev === "scholarly-dark") {
        next = "scholarly-sepia";
      } else if (prev === "scholarly-sepia") {
        next = "scholarly-light";
      } else {
        next = "scholarly-dark";
      }
      localStorage.setItem("stellaron-theme", next);
      applyThemeToDOM(next);
      return next;
    });
  }, []);

  return { activeTheme, setTheme, toggleTheme };
}

function normalizeTheme(theme: string): AppTheme {
  if (theme.includes("light")) return "scholarly-light";
  if (theme.includes("sepia")) return "scholarly-sepia";
  return "scholarly-dark";
}

function applyThemeToDOM(theme: AppTheme) {
  const root = document.documentElement;
  root.classList.remove(
    "theme-scholarly-dark",
    "theme-scholarly-light",
    "theme-scholarly-sepia",
    "dark",
    "light"
  );
  root.classList.add(`theme-${theme}`);
  if (theme === "scholarly-dark") {
    root.classList.add("dark");
  } else {
    root.classList.add("light");
  }
}
