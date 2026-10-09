import { useCallback, useEffect, useState } from "react";
import type { Theme } from "../types";

const FONT_SCALE_STEPS = [0.85, 0.92, 1.0, 1.1, 1.2, 1.35, 1.5];

const KEYS = {
  theme: "buildingAgents:theme",
  fontScale: "buildingAgents:fontScale",
  notesOpen: "buildingAgents:notesOpen",
  sidebarOpen: "buildingAgents:sidebarOpen",
} as const;

function readLocal<T>(key: string, fallback: T, parser: (raw: string) => T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw == null) return fallback;
    return parser(raw);
  } catch {
    return fallback;
  }
}

function writeLocal(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore — quota / private mode
  }
}

export function usePrefs() {
  const [theme, setThemeState] = useState<Theme>(() =>
    readLocal<Theme>(KEYS.theme, "dark", (raw) => (raw === "light" ? "light" : "dark")),
  );

  const [fontScale, setFontScaleState] = useState<number>(() =>
    readLocal<number>(KEYS.fontScale, 1, (raw) => {
      const n = parseFloat(raw);
      return Number.isFinite(n) && n > 0 ? n : 1;
    }),
  );

  const [notesOpen, setNotesOpenState] = useState<boolean>(() =>
    readLocal<boolean>(KEYS.notesOpen, false, (raw) => raw === "true"),
  );

  const [sidebarOpen, setSidebarOpenState] = useState<boolean>(() =>
    readLocal<boolean>(KEYS.sidebarOpen, true, (raw) => raw !== "false"),
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    writeLocal(KEYS.theme, theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", String(fontScale));
    writeLocal(KEYS.fontScale, String(fontScale));
  }, [fontScale]);

  useEffect(() => {
    writeLocal(KEYS.notesOpen, String(notesOpen));
  }, [notesOpen]);

  useEffect(() => {
    writeLocal(KEYS.sidebarOpen, String(sidebarOpen));
  }, [sidebarOpen]);

  const toggleTheme = useCallback(() => {
    setThemeState((t) => (t === "dark" ? "light" : "dark"));
  }, []);

  const stepFontScale = useCallback((delta: 1 | -1) => {
    setFontScaleState((current) => {
      // Find nearest step, then move by delta.
      let nearest = 0;
      for (let i = 0; i < FONT_SCALE_STEPS.length; i++) {
        if (Math.abs(FONT_SCALE_STEPS[i] - current) < Math.abs(FONT_SCALE_STEPS[nearest] - current)) {
          nearest = i;
        }
      }
      const next = Math.min(FONT_SCALE_STEPS.length - 1, Math.max(0, nearest + delta));
      return FONT_SCALE_STEPS[next];
    });
  }, []);

  const resetFontScale = useCallback(() => setFontScaleState(1), []);

  const toggleNotes = useCallback(() => setNotesOpenState((v) => !v), []);
  const toggleSidebar = useCallback(() => setSidebarOpenState((v) => !v), []);

  return {
    theme,
    toggleTheme,
    fontScale,
    stepFontScale,
    resetFontScale,
    notesOpen,
    setNotesOpen: setNotesOpenState,
    toggleNotes,
    sidebarOpen,
    setSidebarOpen: setSidebarOpenState,
    toggleSidebar,
  };
}

export type Prefs = ReturnType<typeof usePrefs>;
