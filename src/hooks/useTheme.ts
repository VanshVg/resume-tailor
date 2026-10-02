import { useCallback, useEffect, useState } from "react";
import { readItem, removeItem, STORAGE_KEYS, writeItem } from "../utils/storage";

export type ThemePreference = "system" | "light" | "dark";

const DARK_QUERY = "(prefers-color-scheme: dark)";

function readPreference(): ThemePreference {
  const saved = readItem(STORAGE_KEYS.theme);
  return saved === "light" || saved === "dark" ? saved : "system";
}

function systemPrefersDark(): boolean {
  return typeof window.matchMedia === "function" && window.matchMedia(DARK_QUERY).matches;
}

export function applyTheme(preference: ThemePreference): void {
  const dark = preference === "dark" || (preference === "system" && systemPrefersDark());
  document.documentElement.classList.toggle("dark", dark);
}

/**
 * The theme preference, defaulting to the OS setting. public/theme.js applies
 * the same logic before first paint; this keeps it in sync afterwards,
 * including when the OS theme changes while the page is open.
 */
export function useTheme(): readonly [ThemePreference, (value: ThemePreference) => void] {
  const [preference, setPreferenceState] = useState<ThemePreference>(readPreference);

  useEffect(() => {
    applyTheme(preference);
    if (preference !== "system" || typeof window.matchMedia !== "function") return;
    const query = window.matchMedia(DARK_QUERY);
    const onChange = () => {
      applyTheme("system");
    };
    query.addEventListener("change", onChange);
    return () => {
      query.removeEventListener("change", onChange);
    };
  }, [preference]);

  const setPreference = useCallback((value: ThemePreference) => {
    setPreferenceState(value);
    if (value === "system") removeItem(STORAGE_KEYS.theme);
    else writeItem(STORAGE_KEYS.theme, value);
  }, []);

  return [preference, setPreference] as const;
}
