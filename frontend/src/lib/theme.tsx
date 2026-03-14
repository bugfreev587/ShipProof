"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { themes, type DashboardTheme, type ThemeColors } from "./theme-colors";

export { getThemeColors } from "./theme-colors";
export type { DashboardTheme, ThemeColors } from "./theme-colors";

// CSS variable names mapped from ThemeColors keys
const cssVarMap: Record<keyof ThemeColors, string> = {
  bgBase: "--bg-base",
  bgSurface: "--bg-surface",
  bgElevated: "--bg-elevated",
  border: "--border",
  borderHover: "--border-hover",
  textPrimary: "--text-primary",
  textSecondary: "--text-secondary",
  textTertiary: "--text-tertiary",
};

function applyCssVars(colors: ThemeColors) {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(cssVarMap)) {
    root.style.setProperty(cssVar, colors[key as keyof ThemeColors]);
  }
}

interface ThemeContextValue {
  theme: DashboardTheme;
  colors: ThemeColors;
  setTheme: (t: DashboardTheme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  colors: themes.dark,
  setTheme: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<DashboardTheme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("shipproof-theme") as DashboardTheme | null;
    if (saved && themes[saved]) {
      setThemeState(saved);
      applyCssVars(themes[saved]);
    } else {
      applyCssVars(themes.dark);
    }
    setMounted(true);
  }, []);

  const setTheme = (t: DashboardTheme) => {
    setThemeState(t);
    localStorage.setItem("shipproof-theme", t);
    applyCssVars(themes[t]);
  };

  const colors = themes[theme] || themes.dark;

  // Prevent flash — render with dark defaults until mounted
  if (!mounted) {
    return (
      <ThemeContext.Provider value={{ theme: "dark", colors: themes.dark, setTheme }}>
        {children}
      </ThemeContext.Provider>
    );
  }

  return (
    <ThemeContext.Provider value={{ theme, colors, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
