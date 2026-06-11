import { useState, useEffect, useCallback } from "react";

export interface ReaderSettingsState {
  fontSize: number;
  lineHeight: number;
  fontFamily: string;
  readerTheme: string;
  layoutMode: "classic" | "redesign";
}

const DEFAULTS: ReaderSettingsState = {
  fontSize: 18,
  lineHeight: 1.6,
  fontFamily: "font-serif",
  readerTheme: "dark",
  layoutMode: "redesign",
};

const STORAGE_KEYS = {
  fontSize: "stellaron-reader-font-size",
  lineHeight: "stellaron-reader-line-height",
  fontFamily: "stellaron-reader-font-family",
  readerTheme: "stellaron-reader-theme",
  layoutMode: "stellaron-reader-layout",
} as const;

/**
 * Manages reader configuration state (font, spacing, theme, layout mode).
 * Persists all settings to localStorage.
 * Replaces the scattered reader settings in BookPage and SettingsModal.
 */
export function useReaderSettings() {
  const [fontSize, setFontSizeState] = useState<number>(DEFAULTS.fontSize);
  const [lineHeight, setLineHeightState] = useState<number>(DEFAULTS.lineHeight);
  const [fontFamily, setFontFamilyState] = useState<string>(DEFAULTS.fontFamily);
  const [readerTheme, setReaderThemeState] = useState<string>(DEFAULTS.readerTheme);
  const [layoutMode, setLayoutModeState] = useState<"classic" | "redesign">(DEFAULTS.layoutMode);

  // Load from localStorage on mount
  useEffect(() => {
    const fs = localStorage.getItem(STORAGE_KEYS.fontSize);
    if (fs) setFontSizeState(parseInt(fs, 10));

    const lh = localStorage.getItem(STORAGE_KEYS.lineHeight);
    if (lh) setLineHeightState(parseFloat(lh));

    const ff = localStorage.getItem(STORAGE_KEYS.fontFamily);
    if (ff) setFontFamilyState(ff);

    const rt = localStorage.getItem(STORAGE_KEYS.readerTheme);
    if (rt) setReaderThemeState(rt);

    const lm = localStorage.getItem(STORAGE_KEYS.layoutMode) as "classic" | "redesign" | null;
    if (lm) setLayoutModeState(lm);
  }, []);

  const setFontSize = useCallback((size: number) => {
    const clamped = Math.max(12, Math.min(32, size));
    setFontSizeState(clamped);
    localStorage.setItem(STORAGE_KEYS.fontSize, String(clamped));
  }, []);

  const setLineHeight = useCallback((height: number) => {
    setLineHeightState(height);
    localStorage.setItem(STORAGE_KEYS.lineHeight, String(height));
  }, []);

  const setFontFamily = useCallback((family: string) => {
    setFontFamilyState(family);
    localStorage.setItem(STORAGE_KEYS.fontFamily, family);
  }, []);

  const setReaderTheme = useCallback((theme: string) => {
    setReaderThemeState(theme);
    localStorage.setItem(STORAGE_KEYS.readerTheme, theme);
  }, []);

  const setLayoutMode = useCallback((mode: "classic" | "redesign") => {
    setLayoutModeState(mode);
    localStorage.setItem(STORAGE_KEYS.layoutMode, mode);
  }, []);

  const resetAll = useCallback(() => {
    setFontSize(DEFAULTS.fontSize);
    setLineHeight(DEFAULTS.lineHeight);
    setFontFamily(DEFAULTS.fontFamily);
    setReaderTheme(DEFAULTS.readerTheme);
    setLayoutMode(DEFAULTS.layoutMode);
  }, [setFontSize, setLineHeight, setFontFamily, setReaderTheme, setLayoutMode]);

  return {
    fontSize,
    setFontSize,
    lineHeight,
    setLineHeight,
    fontFamily,
    setFontFamily,
    readerTheme,
    setReaderTheme,
    layoutMode,
    setLayoutMode,
    resetAll,
  };
}
