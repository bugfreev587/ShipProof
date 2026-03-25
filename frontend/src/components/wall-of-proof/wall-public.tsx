import type { WallProof, WallDisplayConfig } from "./types";
import { getWallThemeColors } from "./types";
import WallMasonry from "./wall-masonry";
import WallCarousel from "./wall-carousel";
import AiSummaryCard from "./ai-summary-card";

export default function WallPublic({
  proofs,
  config,
  header,
  showAiSummary = false,
}: {
  proofs: WallProof[];
  config: WallDisplayConfig;
  header?: { title: string; subtitle?: string; productName?: string };
  showAiSummary?: boolean;
}) {
  const theme = getWallThemeColors(config.theme);

  return (
    <div>
      {/* Header */}
      {header && (
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold mb-2"
            style={{ color: theme.textPrimary }}
          >
            {header.title}
          </h1>
          <p style={{ color: theme.textSecondary }}>
            {header.subtitle || (
              <>
                What people are saying about{" "}
                <span className="font-medium" style={{ color: theme.textPrimary }}>
                  {header.productName}
                </span>
              </>
            )}
          </p>
        </div>
      )}

      {/* AI Summary */}
      {showAiSummary && proofs.length > 0 && (
        <AiSummaryCard proofs={proofs} theme={theme} />
      )}

      {/* Proofs */}
      {proofs.length === 0 ? (
        <div
          className="text-center py-12"
          style={{ color: theme.textTertiary }}
        >
          No proofs yet.
        </div>
      ) : config.layout === "carousel" ? (
        <WallCarousel
          proofs={proofs}
          theme={theme}
          borderRadius={config.borderRadius}
          showSourceBadges={config.showSourceBadges}
          showVerifiedTags={config.showVerifiedTags}
          showTimeContext={config.showTimeContext}
        />
      ) : (
        <WallMasonry
          proofs={proofs}
          theme={theme}
          columns={config.columns || 3}
          spacing={config.cardSpacing}
          borderRadius={config.borderRadius}
          showSourceBadges={config.showSourceBadges}
          showVerifiedTags={config.showVerifiedTags}
          showTimeContext={config.showTimeContext}
        />
      )}

      {/* Branding */}
      {config.showBranding && (
        <div
          className="flex items-center justify-center gap-1 pt-6 pb-2 text-xs"
          style={{ color: theme.textTertiary }}
        >
          <a
            href="https://shipproof.io"
            className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
            style={{ color: "#6366F1", textDecoration: "none" }}
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg width="16" height="16" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="#6366F1" />
              <path
                d="M32,46 C32,46 16,35 16,26 C16,20 19,17 24,17 C27,17 30,19 32,21 C34,19 37,17 40,17 C45,17 48,20 48,26 C48,35 32,46 32,46Z"
                fill="white"
              />
            </svg>
            ShipProof
          </a>
        </div>
      )}
    </div>
  );
}
