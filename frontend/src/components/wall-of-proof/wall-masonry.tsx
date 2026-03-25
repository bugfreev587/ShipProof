import type { WallProof, ThemeColors } from "./types";
import ProofCard from "./proof-card";

export default function WallMasonry({
  proofs,
  theme,
  columns = 3,
  spacing = 16,
  borderRadius = 12,
  showSourceBadges = true,
  showVerifiedTags = true,
  showTimeContext = true,
}: {
  proofs: WallProof[];
  theme: ThemeColors;
  columns?: 1 | 2 | 3;
  spacing?: number;
  borderRadius?: number;
  showSourceBadges?: boolean;
  showVerifiedTags?: boolean;
  showTimeContext?: boolean;
}) {
  const columnClasses = {
    1: "columns-1",
    2: "columns-1 sm:columns-2",
    3: "columns-1 sm:columns-2 lg:columns-3",
  };

  return (
    <div
      className={columnClasses[columns]}
      style={{ columnGap: `${spacing}px` }}
    >
      {proofs.map((proof) => (
        <div key={proof.id} style={{ marginBottom: `${spacing}px` }}>
          <ProofCard
            proof={proof}
            theme={theme}
            borderRadius={borderRadius}
            showSourceBadges={showSourceBadges}
            showVerifiedTags={showVerifiedTags}
            showTimeContext={showTimeContext}
          />
        </div>
      ))}
    </div>
  );
}
