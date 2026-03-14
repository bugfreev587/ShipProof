export type DashboardTheme = "dark" | "dim" | "gray" | "light";

export interface ThemeColors {
  bgBase: string;
  bgSurface: string;
  bgElevated: string;
  border: string;
  borderHover: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
}

export const themes: Record<DashboardTheme, ThemeColors> = {
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

export function getThemeColors(theme: DashboardTheme): ThemeColors {
  return themes[theme] || themes.dark;
}
