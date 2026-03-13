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
    bgBase: "#F9FAFB",
    bgSurface: "#FFFFFF",
    bgElevated: "#F3F4F6",
    border: "#E5E7EB",
    borderHover: "#D1D5DB",
    textPrimary: "#111827",
    textSecondary: "#6B7280",
    textTertiary: "#9CA3AF",
  },
};

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
    }
    setMounted(true);
  }, []);

  const setTheme = (t: DashboardTheme) => {
    setThemeState(t);
    localStorage.setItem("shipproof-theme", t);
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
