import { Metadata } from "next";
import { fetchPublicWallProofs } from "@/lib/api";
import { getCompanyLogoUrl } from "@/lib/company-logo";
import { CompanyLogoImg } from "@/components/company-logo";
import { ViewTracker } from "@/components/view-tracker";

export const dynamic = "force-dynamic";

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

function getThemeColors(theme: string) {
  switch (theme) {
    case "dim":
      return {
        bgBase: "#15202B", bgCard: "#1E2D3D", borderColor: "#2B3D4F",
        textPrimary: "#F1F1F3", textSecondary: "#9CA3AF", textTertiary: "#6B7280",
      };
    case "gray":
      return {
        bgBase: "#2A2A30", bgCard: "#343440", borderColor: "#45454F",
        textPrimary: "#F1F1F3", textSecondary: "#B0B0B8", textTertiary: "#8A8A94",
      };
    case "light":
      return {
        bgBase: "#F9FAFB", bgCard: "#FFFFFF", borderColor: "#E5E7EB",
        textPrimary: "#111827", textSecondary: "#6B7280", textTertiary: "#9CA3AF",
      };
    default: // dark
      return {
        bgBase: "#0F0F10", bgCard: "#1A1A1F", borderColor: "#2A2A30",
        textPrimary: "#F1F1F3", textSecondary: "#9CA3AF", textTertiary: "#6B7280",
      };
  }
}

function WallCard({ proof, t, wall, radius, masonry, spacing }: {
  proof: { id: string; source_platform: string; author_name: string; author_title: string | null; author_avatar_url: string | null; content_text: string | null; content_image_url: string | null; created_at: string };
  t: ReturnType<typeof getThemeColors>;
  wall: { show_platform_icon: boolean; border_radius: number };
  radius: string;
  masonry?: boolean;
  spacing?: string;
}) {
  const companyLogoUrl = getCompanyLogoUrl(proof.author_title);
  return (
    <div
      className={masonry ? "break-inside-avoid p-5 relative" : "p-5 relative"}
      style={{
        marginBottom: masonry ? spacing : undefined,
        borderRadius: radius,
        border: `1px solid ${t.borderColor}`,
        background: t.bgCard,
        width: masonry ? undefined : "100%",
      }}
    >
      {companyLogoUrl && <CompanyLogoImg url={companyLogoUrl} />}
      <div className="flex items-center gap-2 mb-3">
        {proof.author_avatar_url ? (
          <img src={proof.author_avatar_url} alt={proof.author_name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        ) : (
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white flex-shrink-0 ${PLATFORM_COLORS[proof.source_platform] || "bg-gray-500"}`}>
            {proof.author_name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <div className="text-sm font-medium" style={{ color: t.textPrimary }}>{proof.author_name}</div>
          {proof.author_title && <div className="text-xs" style={{ color: t.textTertiary }}>{proof.author_title}</div>}
        </div>
      </div>
      {proof.content_text && <p className="text-sm leading-relaxed" style={{ color: t.textSecondary }}>{proof.content_text}</p>}
      {proof.content_image_url && (
        <img src={proof.content_image_url.replace(/^https?:\/\/https?:\/\//, "https://")} alt="Proof" className="mt-3 w-full"
          style={{ borderRadius: `${Math.max(wall.border_radius - 4, 0)}px`, border: `1px solid ${t.borderColor}` }} />
      )}
      <div className="mt-3 text-xs" style={{ color: t.textTertiary }}>
        {new Date(proof.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await fetchPublicWallProofs(slug);
    return {
      title: `${data.wall.name} — ${data.product.name} | ShipProof`,
      description: `Wall of Love for ${data.product.name}. See what people are saying!`,
    };
  } catch {
    return { title: "Wall of Love | ShipProof" };
  }
}

export default async function WallPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let data;
  try {
    data = await fetchPublicWallProofs(slug);
  } catch {
    return (
      <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center text-[#9CA3AF]">
        Wall not found.
      </div>
    );
  }

  const { wall, product, proofs } = data;
  const t = getThemeColors(wall.theme);
  const radius = `${wall.border_radius}px`;
  const spacing = `${wall.card_spacing}px`;
  return (
    <div className="min-h-screen" style={{ background: t.bgBase }}>
      <ViewTracker entityType="wall" slug={slug} />
      {/* Header */}
      {wall.show_header !== false && (
        <div className="max-w-6xl mx-auto px-4 py-12 text-center">
          <h1 className="text-3xl font-bold mb-2" style={{ color: t.textPrimary }}>{wall.name}</h1>
          <p style={{ color: t.textSecondary }}>
            {wall.subtitle || (
              <>
                What people are saying about{" "}
                <span className="font-medium" style={{ color: t.textPrimary }}>{product.name}</span>
              </>
            )}
          </p>
        </div>
      )}

      {/* Proof cards */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {proofs.length === 0 ? (
          <div className="text-center py-12" style={{ color: t.textTertiary }}>
            No proofs yet.
          </div>
        ) : (wall.layout || "masonry") === "marquee" ? (
          (() => {
            const minCards = Math.max(6, proofs.length);
            const repeatCount = Math.ceil(minCards / proofs.length);
            const filled = [];
            for (let i = 0; i < repeatCount; i++) filled.push(...proofs);
            const duration = filled.length * 4.5;
            return (
              <>
                <style dangerouslySetInnerHTML={{ __html: `
@keyframes wp-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
.wp-marquee-wrap { overflow: hidden; width: 100%; mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%); -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%); }
.wp-marquee-track { display: flex; gap: ${spacing}; animation: wp-marquee ${duration}s linear infinite; width: max-content; }
.wp-marquee-track:hover { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .wp-marquee-track { animation: none; } .wp-marquee-wrap { overflow-x: auto; mask-image: none; -webkit-mask-image: none; } }
                ` }} />
                <div className="wp-marquee-wrap">
                  <div className="wp-marquee-track">
                    {[...filled, ...filled].map((proof, i) => (
                      <WallCard key={`m-${i}`} proof={proof} t={t} wall={wall} radius={radius} />
                    ))}
                  </div>
                </div>
              </>
            );
          })()
        ) : wall.layout === "carousel" ? (
          <div style={{ overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: "8px" }}>
            <div style={{ display: "flex", gap: spacing }}>
              {proofs.map((proof) => (
                <div key={proof.id} style={{ flexShrink: 0, width: "340px", scrollSnapAlign: "start" }}>
                  <WallCard proof={proof} t={t} wall={wall} radius={radius} />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div
            className="columns-1 sm:columns-2 lg:columns-3"
            style={{ columnGap: spacing }}
          >
            {proofs.map((proof) => (
              <WallCard key={proof.id} proof={proof} t={t} wall={wall} radius={radius} masonry spacing={spacing} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {wall.show_branding && (
        <div className="flex items-center justify-center gap-1 pb-8 text-xs" style={{ color: t.textTertiary }}>
          <a
            href="https://shipproof.io"
            className="inline-flex items-center gap-1 hover:opacity-80 transition-opacity"
            style={{ color: "#6366F1", textDecoration: "none" }}
          >
            <svg width="18" height="18" viewBox="0 0 64 64">
              <rect x="4" y="4" width="56" height="56" rx="14" fill="#6366F1"/>
              <rect x="14" y="11" width="36" height="26" rx="7" fill="white"/>
              <path d="M22,37 L18,48 L30,37Z" fill="white"/>
              <path d="M22,22 L28,30 L42,15" fill="none" stroke="#6366F1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            ShipProof
          </a>
        </div>
      )}
    </div>
  );
}
