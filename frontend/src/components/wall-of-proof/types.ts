export interface WallProof {
  id: string;
  author_name: string;
  author_handle?: string;
  author_title?: string | null;
  author_avatar_url?: string | null;
  company_name?: string;
  company_logo_url?: string;
  content_text?: string | null;
  content_image_url?: string | null;
  source_platform: string;
  source_url?: string | null;
  rating?: number;
  is_verified?: boolean;
  screenshot_url?: string | null;
  days_after_launch?: number;
  created_at: string;
  tags?: string[];
}

export interface WallDisplayConfig {
  layout: "masonry" | "carousel";
  theme: "dark" | "light" | "dim" | "gray";
  columns?: 1 | 2 | 3;
  showSourceBadges: boolean;
  showVerifiedTags: boolean;
  showTimeContext: boolean;
  showBranding: boolean;
  borderRadius: number;
  cardSpacing: number;
  showPlatformIcon: boolean;
}

export interface ThemeColors {
  bgBase: string;
  bgCard: string;
  borderColor: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
}

export function getWallThemeColors(theme: string): ThemeColors {
  switch (theme) {
    case "dim":
      return {
        bgBase: "#15202B",
        bgCard: "#1E2D3D",
        borderColor: "#2B3D4F",
        textPrimary: "#F1F1F3",
        textSecondary: "#9CA3AF",
        textTertiary: "#6B7280",
      };
    case "gray":
      return {
        bgBase: "#2A2A30",
        bgCard: "#343440",
        borderColor: "#45454F",
        textPrimary: "#F1F1F3",
        textSecondary: "#B0B0B8",
        textTertiary: "#8A8A94",
      };
    case "light":
      return {
        bgBase: "#F9FAFB",
        bgCard: "#FFFFFF",
        borderColor: "#E5E7EB",
        textPrimary: "#111827",
        textSecondary: "#6B7280",
        textTertiary: "#9CA3AF",
      };
    default:
      return {
        bgBase: "#0F0F10",
        bgCard: "#1A1A1F",
        borderColor: "#2A2A30",
        textPrimary: "#F1F1F3",
        textSecondary: "#9CA3AF",
        textTertiary: "#6B7280",
      };
  }
}
