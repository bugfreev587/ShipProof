import { Metadata } from "next";
import { fetchPublicWallProofs } from "@/lib/api";

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
  const isDark = wall.theme === "dark";
  const bgBase = isDark ? "#0F0F10" : "#F9FAFB";
  const bgCard = isDark ? "#1A1A1F" : "#FFFFFF";
  const borderColor = isDark ? "#2A2A30" : "#E5E7EB";
  const textPrimary = isDark ? "#F1F1F3" : "#111827";
  const textSecondary = isDark ? "#9CA3AF" : "#6B7280";
  const textTertiary = isDark ? "#6B7280" : "#9CA3AF";
  const radius = `${wall.border_radius}px`;
  const spacing = `${wall.card_spacing}px`;

  return (
    <div className="min-h-screen" style={{ background: bgBase }}>
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-2" style={{ color: textPrimary }}>{wall.name}</h1>
        <p style={{ color: textSecondary }}>
          What people are saying about{" "}
          <span className="font-medium" style={{ color: textPrimary }}>{product.name}</span>
        </p>
      </div>

      {/* Masonry Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {proofs.length === 0 ? (
          <div className="text-center py-12" style={{ color: textTertiary }}>
            No proofs yet.
          </div>
        ) : (
          <div
            className="columns-1 sm:columns-2 lg:columns-3"
            style={{ columnGap: spacing }}
          >
            {proofs.map((proof) => (
              <div
                key={proof.id}
                className="break-inside-avoid p-5"
                style={{
                  marginBottom: spacing,
                  borderRadius: radius,
                  border: `1px solid ${borderColor}`,
                  background: bgCard,
                }}
              >
                {/* Author */}
                <div className="flex items-center gap-2 mb-3">
                  {proof.author_avatar_url ? (
                    <img
                      src={proof.author_avatar_url}
                      alt={proof.author_name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : wall.show_platform_icon ? (
                    <span
                      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white ${PLATFORM_COLORS[proof.source_platform] || "bg-gray-500"}`}
                    >
                      {PLATFORM_LABELS[proof.source_platform] || "O"}
                    </span>
                  ) : null}
                  <div>
                    <div className="text-sm font-medium" style={{ color: textPrimary }}>
                      {proof.author_name}
                    </div>
                    {proof.author_title && (
                      <div className="text-xs" style={{ color: textTertiary }}>
                        {proof.author_title}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                {proof.content_text && (
                  <p className="text-sm leading-relaxed" style={{ color: textSecondary }}>
                    {proof.content_text}
                  </p>
                )}

                {proof.content_image_url && (
                  <img
                    src={proof.content_image_url.replace(/^https?:\/\/https?:\/\//, "https://")}
                    alt="Proof"
                    className="mt-3 w-full"
                    style={{
                      borderRadius: `${Math.max(wall.border_radius - 4, 0)}px`,
                      border: `1px solid ${borderColor}`,
                    }}
                  />
                )}

                {/* Date */}
                <div className="mt-3 text-xs" style={{ color: textTertiary }}>
                  {new Date(proof.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {wall.show_branding && (
        <div className="text-center pb-8 text-xs" style={{ color: textTertiary }}>
          Powered by{" "}
          <a
            href="https://shipproof.io"
            className="hover:opacity-80 transition-opacity"
            style={{ color: "#6366F1", textDecoration: "none" }}
          >
            ShipProof
          </a>
        </div>
      )}
    </div>
  );
}
