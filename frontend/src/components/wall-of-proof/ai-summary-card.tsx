import type { WallProof, ThemeColors } from "./types";
import { getPlatformInfo } from "./platform-badge";

export default function AiSummaryCard({
  proofs,
  theme,
}: {
  proofs: WallProof[];
  theme: ThemeColors;
}) {
  if (proofs.length === 0) return null;

  const platforms = new Set(proofs.map((p) => p.source_platform).filter(Boolean));
  const verifiedCount = proofs.filter((p) => p.is_verified).length;
  const ratings = proofs.filter((p) => p.rating != null && p.rating > 0).map((p) => p.rating!);
  const avgRating = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : null;
  const platformNames = Array.from(platforms)
    .slice(0, 3)
    .map((p) => getPlatformInfo(p).label);

  return (
    <div
      className="rounded-xl p-5 mb-6"
      style={{
        background: `linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))`,
        border: `1px solid rgba(99,102,241,0.2)`,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm" style={{ color: "#818CF8" }}>
          &#10022;
        </span>
        <span
          className="text-xs font-semibold uppercase tracking-wider"
          style={{ color: "#818CF8" }}
        >
          AI Summary
        </span>
      </div>

      <p className="text-sm leading-relaxed mb-4" style={{ color: theme.textSecondary }}>
        {proofs.length} user{proofs.length !== 1 ? "s" : ""}
        {platformNames.length > 0 && (
          <> across {platformNames.join(", ")}</>
        )}
        {" "}shared their experience.
        {verifiedCount > 0 && ` ${verifiedCount} verified.`}
      </p>

      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-lg font-bold" style={{ color: theme.textPrimary }}>
            {proofs.length}
          </div>
          <div className="text-[10px]" style={{ color: theme.textTertiary }}>
            Proofs
          </div>
        </div>
        {verifiedCount > 0 && (
          <div className="text-center">
            <div className="text-lg font-bold text-[#22C55E]">{verifiedCount}</div>
            <div className="text-[10px]" style={{ color: theme.textTertiary }}>
              Verified
            </div>
          </div>
        )}
        {avgRating && (
          <div className="text-center">
            <div className="text-lg font-bold text-[#F59E0B]">{avgRating}</div>
            <div className="text-[10px]" style={{ color: theme.textTertiary }}>
              Avg Rating
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
