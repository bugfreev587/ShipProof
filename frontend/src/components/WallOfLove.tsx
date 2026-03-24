import { fetchPublicWallProofs, type Proof } from "@/lib/api";

const PLATFORM_COLORS: Record<string, string> = {
  product_hunt: "bg-red-500",
  reddit: "bg-orange-500",
  twitter: "bg-zinc-700",
  hackernews: "bg-orange-400",
  indiehackers: "bg-blue-500",
  direct: "bg-green-500",
  other: "bg-gray-500",
};

const PLATFORM_LABELS: Record<string, string> = {
  product_hunt: "P",
  reddit: "R",
  twitter: "X",
  hackernews: "H",
  indiehackers: "I",
  direct: "D",
  other: "O",
};

type PgText = { String: string; Valid: boolean } | string | null;

function pgStr(v: PgText): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v || null;
  return v.Valid ? v.String : null;
}

function TestimonialCard({ proof }: { proof: Proof }) {
  const authorTitle = pgStr(proof.author_title as PgText);
  const contentText = pgStr(proof.content_text as PgText);

  return (
    <div
      className="flex-shrink-0 w-[300px] rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-5 hover:border-[#3F3F46] transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <span
          className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold text-white flex-shrink-0 ${PLATFORM_COLORS[proof.source_platform] || "bg-gray-500"}`}
        >
          {PLATFORM_LABELS[proof.source_platform] || "O"}
        </span>
        <div>
          <div className="text-sm font-semibold text-white">
            {proof.author_name}
          </div>
          {authorTitle && (
            <div className="text-xs text-[#6B7280] mt-0.5">{authorTitle}</div>
          )}
        </div>
      </div>
      {contentText && (
        <p className="text-sm leading-relaxed text-[#9CA3AF] line-clamp-4">
          {contentText}
        </p>
      )}
    </div>
  );
}

export default async function WallOfLove() {
  let proofs: Proof[] = [];
  try {
    const data = await fetchPublicWallProofs("first-wall-e9e4d4");
    proofs = data.proofs;
  } catch {
    // Wall not available
  }

  if (proofs.length === 0) return null;

  // Split into two rows
  const mid = Math.ceil(proofs.length / 2);
  const row1Proofs = proofs.slice(0, mid);
  const row2Proofs = proofs.slice(mid);

  // Ensure enough cards: duplicate to fill at least 6 per row
  function fillRow(items: Proof[]): Proof[] {
    if (items.length === 0) return [];
    const minCards = Math.max(6, items.length);
    const repeatCount = Math.ceil(minCards / items.length);
    const filled: Proof[] = [];
    for (let i = 0; i < repeatCount; i++) filled.push(...items);
    return filled;
  }

  const filled1 = fillRow(row1Proofs);
  const filled2 = fillRow(row2Proofs);

  const duration1 = filled1.length * 4.5;
  const duration2 = filled2.length * 4.5 + 5; // slightly slower for parallax

  return (
    <section className="border-t border-[#2A2A30] py-20 overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 text-center mb-10">
        <h2 className="text-[28px] font-medium text-white">
          Loved by indie hackers
        </h2>
        <p className="mt-2 text-sm text-[#8B8B92]">
          See what builders are saying about ShipProof
        </p>
      </div>

      <style
        dangerouslySetInnerHTML={{
          __html: `
@keyframes marquee-scroll-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes marquee-scroll-right {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
.wol-marquee-container {
  overflow: hidden;
  width: 100%;
  mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%);
}
.wol-marquee-row1 {
  display: flex;
  gap: 16px;
  animation: marquee-scroll-left ${duration1}s linear infinite;
  width: max-content;
}
.wol-marquee-row2 {
  display: flex;
  gap: 16px;
  animation: marquee-scroll-right ${duration2}s linear infinite;
  width: max-content;
}
.wol-marquee-row1:hover,
.wol-marquee-row2:hover {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  .wol-marquee-row1,
  .wol-marquee-row2 {
    animation: none;
  }
  .wol-marquee-container {
    overflow-x: auto;
    mask-image: none;
    -webkit-mask-image: none;
  }
}
`,
        }}
      />

      <div className="space-y-4">
        {/* Row 1: scrolls left */}
        <div className="wol-marquee-container">
          <div className="wol-marquee-row1">
            {filled1.map((proof, i) => (
              <TestimonialCard key={`r1a-${i}`} proof={proof} />
            ))}
            {filled1.map((proof, i) => (
              <TestimonialCard key={`r1b-${i}`} proof={proof} />
            ))}
          </div>
        </div>

        {/* Row 2: scrolls right (reverse) */}
        {filled2.length > 0 && (
          <div className="wol-marquee-container">
            <div className="wol-marquee-row2">
              {filled2.map((proof, i) => (
                <TestimonialCard key={`r2a-${i}`} proof={proof} />
              ))}
              {filled2.map((proof, i) => (
                <TestimonialCard key={`r2b-${i}`} proof={proof} />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
