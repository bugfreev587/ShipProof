"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type DashboardTheme = "dark" | "dim" | "gray" | "light";

interface ThemeColors {
  bgBase: string;
  bgSurface: string;
  bgElevated: string;
  border: string;
  borderHover: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
}

const themes: Record<DashboardTheme, ThemeColors> = {
  dark: {
    bgBase: "#0F0F10",
    bgSurface: "#1A1A1F",
    bgElevated: "#242429",
    border: "#2A2A30",
    borderHover: "#3F3F46",
    textPrimary: "#F1F1F3",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
  },
  dim: {
    bgBase: "#15202B",
    bgSurface: "#1E2D3D",
    bgElevated: "#253545",
    border: "#2B3D4F",
    borderHover: "#3A5068",
    textPrimary: "#F1F1F3",
    textSecondary: "#9CA3AF",
    textTertiary: "#6B7280",
  },
  gray: {
    bgBase: "#1E1E22",
    bgSurface: "#28282E",
    bgElevated: "#323238",
    border: "#3A3A42",
    borderHover: "#4A4A54",
    textPrimary: "#F1F1F3",
    textSecondary: "#B0B0B8",
    textTertiary: "#8A8A94",
  },
  light: {
    bgBase: "#EEEEF0",
    bgSurface: "#FFFFFF",
    bgElevated: "#E0E1E6",
    border: "#D1D5DB",
    borderHover: "#B0B5BD",
    textPrimary: "#000000",
    textSecondary: "#374151",
    textTertiary: "#6B7280",
  },
};

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

export function getThemeColors(theme: DashboardTheme): ThemeColors {
  return themes[theme] || themes.dark;
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
