import type { WallProof, ThemeColors } from "./types";
import { PlatformBadge, PlatformAvatarBadge, getLaunchTimeLabel, getPlatformInfo } from "./platform-badge";
import { getCompanyLogoUrl } from "@/lib/company-logo";
import { CompanyLogoImg } from "@/components/company-logo";

function pgStr(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v || null;
  if (typeof v === "object" && "Valid" in (v as Record<string, unknown>)) {
    const pg = v as { String: string; Valid: boolean };
    return pg.Valid ? pg.String : null;
  }
  return null;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          className={`h-3.5 w-3.5 ${star <= rating ? "text-[#F59E0B]" : "text-[#3F3F46]"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default function ProofCard({
  proof,
  theme,
  borderRadius = 12,
  showSourceBadges = true,
  showVerifiedTags = true,
  showTimeContext = true,
}: {
  proof: WallProof;
  theme: ThemeColors;
  borderRadius?: number;
  showSourceBadges?: boolean;
  showVerifiedTags?: boolean;
  showTimeContext?: boolean;
}) {
  const contentText = pgStr(proof.content_text);
  const contentImageUrl = pgStr(proof.content_image_url);
  const authorTitle = pgStr(proof.author_title);
  const companyLogoUrl = getCompanyLogoUrl(authorTitle);
  const platformInfo = getPlatformInfo(proof.source_platform);

  return (
    <div
      className="break-inside-avoid relative transition-all duration-200 hover:shadow-lg hover:-translate-y-px"
      style={{
        borderRadius: `${borderRadius}px`,
        border: `1px solid ${theme.borderColor}`,
        background: theme.bgCard,
        padding: "20px",
      }}
    >
      {companyLogoUrl && <CompanyLogoImg url={companyLogoUrl} />}

      {/* Author row */}
      <div className="flex items-center gap-3 mb-3">
        <div className="relative flex-shrink-0">
          {proof.author_avatar_url ? (
            <img
              src={proof.author_avatar_url}
              alt={proof.author_name}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <span
              className="inline-flex items-center justify-center w-9 h-9 rounded-full text-xs font-bold text-white"
              style={{ backgroundColor: platformInfo.color }}
            >
              {proof.author_name.charAt(0).toUpperCase()}
            </span>
          )}
          {showSourceBadges && proof.source_platform && (
            <PlatformAvatarBadge platform={proof.source_platform} />
          )}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold truncate" style={{ color: theme.textPrimary }}>
            {proof.author_name}
          </div>
          {authorTitle && (
            <div className="text-xs truncate" style={{ color: theme.textTertiary }}>
              {authorTitle}
            </div>
          )}
        </div>
      </div>

      {/* Rating */}
      {proof.rating != null && proof.rating > 0 && (
        <div className="mb-2">
          <StarRating rating={proof.rating} />
        </div>
      )}

      {/* Content */}
      {contentText && (
        <p className="text-sm leading-relaxed" style={{ color: theme.textSecondary }}>
          {contentText}
        </p>
      )}

      {/* Screenshot / image */}
      {contentImageUrl && (
        <img
          src={contentImageUrl.replace(/^https?:\/\/https?:\/\//, "https://")}
          alt="Proof"
          className="mt-3 w-full"
          style={{
            borderRadius: `${Math.max(borderRadius - 4, 0)}px`,
            border: `1px solid ${theme.borderColor}`,
          }}
        />
      )}

      {/* Footer tags */}
      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {showVerifiedTags && proof.is_verified && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[#22C55E]/10 px-2 py-0.5 text-[10px] font-medium text-[#22C55E]">
            <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Verified
          </span>
        )}
        {showSourceBadges && proof.source_platform && proof.source_platform !== "manual" && proof.source_platform !== "other" && (
          <PlatformBadge platform={proof.source_platform} />
        )}
        {showTimeContext && proof.days_after_launch != null && (
          <span
            className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: `${theme.borderColor}`,
              color: theme.textTertiary,
            }}
          >
            {getLaunchTimeLabel(proof.days_after_launch)}
          </span>
        )}
      </div>
    </div>
  );
}
