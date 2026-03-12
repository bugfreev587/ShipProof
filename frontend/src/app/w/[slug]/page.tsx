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

  return (
    <div className="min-h-screen bg-[#0F0F10]">
      {/* Header */}
      <div className="max-w-6xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-[#F1F1F3] mb-2">{wall.name}</h1>
        <p className="text-[#9CA3AF]">
          What people are saying about{" "}
          <span className="text-[#F1F1F3] font-medium">{product.name}</span>
        </p>
      </div>

      {/* Masonry Grid */}
      <div className="max-w-6xl mx-auto px-4 pb-12">
        {proofs.length === 0 ? (
          <div className="text-center text-[#6B7280] py-12">
            No proofs yet.
          </div>
        ) : (
          <div
            className="columns-1 sm:columns-2 lg:columns-3"
            style={{ columnGap: "16px" }}
          >
            {proofs.map((proof) => (
              <div
                key={proof.id}
                className="break-inside-avoid mb-4 rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-5"
              >
                {/* Author */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white ${PLATFORM_COLORS[proof.source_platform] || "bg-gray-500"}`}
                  >
                    {PLATFORM_LABELS[proof.source_platform] || "O"}
                  </span>
                  <div>
                    <div className="text-sm font-medium text-[#F1F1F3]">
                      {proof.author_name}
                    </div>
                    {proof.author_title && (
                      <div className="text-xs text-[#6B7280]">
                        {proof.author_title}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                {proof.content_text && (
                  <p className="text-sm text-[#9CA3AF] leading-relaxed">
                    {proof.content_text}
                  </p>
                )}

                {proof.content_image_url && (
                  <img
                    src={proof.content_image_url}
                    alt="Proof"
                    className="mt-3 w-full rounded-lg border border-[#2A2A30]"
                  />
                )}

                {/* Date */}
                <div className="mt-3 text-xs text-[#6B7280]">
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
      <div className="text-center pb-8 text-xs text-[#6B7280]">
        Powered by{" "}
        <a
          href="https://shipproof.io"
          className="text-[#6366F1] hover:text-[#818CF8] transition-colors"
        >
          ShipProof
        </a>
      </div>
    </div>
  );
}
