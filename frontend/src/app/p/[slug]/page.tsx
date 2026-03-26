import type { Metadata } from "next";
import { fetchPublicProofPage } from "@/lib/api";
import type { Proof } from "@/lib/api";
import { getWallThemeColors } from "@/components/wall-of-proof/types";
import type { WallProof, ThemeColors } from "@/components/wall-of-proof/types";
import WallMasonry from "@/components/wall-of-proof/wall-masonry";
import { ProofPageForm } from "@/components/proof-page/proof-page-form";

export const dynamic = "force-dynamic";

function pgStr(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v || null;
  if (typeof v === "object" && v !== null && "Valid" in v) {
    const pg = v as { String: string; Valid: boolean };
    return pg.Valid ? pg.String : null;
  }
  return null;
}

function toWallProof(proof: Proof): WallProof {
  return {
    id: proof.id,
    author_name: proof.author_name,
    author_title: pgStr(proof.author_title),
    author_avatar_url: pgStr(proof.author_avatar_url),
    content_text: pgStr(proof.content_text),
    content_image_url: pgStr(proof.content_image_url),
    source_platform: proof.source_platform,
    source_url: proof.source_url,
    rating: proof.rating,
    is_verified: proof.collection_method === "submission",
    created_at: proof.created_at,
    tags: proof.tags,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await fetchPublicProofPage(slug);
    const title = data.config.proof_page_title || `What people say about ${data.product.name}`;
    return {
      title: `${title} — ${data.product.name} | ShipProof`,
      description:
        data.config.proof_page_subtitle ||
        `Share your experience with ${data.product.name}. See what others are saying!`,
    };
  } catch {
    return { title: "Proof Page | ShipProof" };
  }
}

function StatsBar({
  proofCount,
  verifiedCount,
  avgRating,
  theme,
}: {
  proofCount: number;
  verifiedCount: number;
  avgRating: number | null;
  theme: ThemeColors;
}) {
  if (proofCount === 0) return null;

  return (
    <div
      className="flex flex-wrap items-center justify-center gap-6 py-4 px-6 rounded-xl"
      style={{
        background: theme.bgCard,
        border: `1px solid ${theme.borderColor}`,
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
          {proofCount}
        </span>
        <span className="text-sm" style={{ color: theme.textSecondary }}>
          {proofCount === 1 ? "proof" : "proofs"}
        </span>
      </div>
      {verifiedCount > 0 && (
        <div className="flex items-center gap-2">
          <svg
            className="h-4 w-4 text-[#22C55E]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
            {verifiedCount}
          </span>
          <span className="text-sm" style={{ color: theme.textSecondary }}>
            verified
          </span>
        </div>
      )}
      {avgRating !== null && (
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <svg
                key={star}
                className={`h-4 w-4 ${star <= Math.round(avgRating) ? "text-[#F59E0B]" : "text-[#3F3F46]"}`}
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <span className="text-2xl font-bold" style={{ color: theme.textPrimary }}>
            {avgRating.toFixed(1)}
          </span>
          <span className="text-sm" style={{ color: theme.textSecondary }}>
            avg rating
          </span>
        </div>
      )}
    </div>
  );
}

export default async function ProofPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let data;
  try {
    data = await fetchPublicProofPage(slug);
  } catch {
    return (
      <div className="min-h-screen bg-[#0F0F10] flex items-center justify-center text-[#9CA3AF]">
        Proof page not found.
      </div>
    );
  }

  const { product, config, proofs } = data;
  const theme = getWallThemeColors(config.proof_page_theme);
  const wallProofs = proofs.map(toWallProof);

  const proofCount = proofs.length;
  const verifiedCount = proofs.filter((p) => p.collection_method === "submission").length;
  const ratingsWithValue = proofs.filter((p) => p.rating != null && p.rating > 0);
  const avgRating =
    ratingsWithValue.length > 0
      ? ratingsWithValue.reduce((sum, p) => sum + (p.rating ?? 0), 0) / ratingsWithValue.length
      : null;

  const title = config.proof_page_title || `What people say about ${product.name}`;
  const subtitle =
    config.proof_page_subtitle ||
    `Real experiences from real users. Share yours too!`;
  const formHeading = config.proof_page_form_heading || "Share your experience";
  const showForm = config.proof_page_show_form;
  const showBranding = config.proof_page_show_branding;

  // Smart layout based on proof count
  const layout: "form-hero" | "small-wall" | "wall-primary" | "wall-dominates" =
    proofCount === 0
      ? "form-hero"
      : proofCount <= 3
        ? "small-wall"
        : proofCount <= 10
          ? "wall-primary"
          : "wall-dominates";

  const columns: 1 | 2 | 3 = proofCount <= 3 ? 2 : 3;

  return (
    <div className="min-h-screen" style={{ background: theme.bgBase }}>
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          {product.logo_url && (
            <div className="flex justify-center mb-4">
              <img
                src={product.logo_url}
                alt={product.name}
                className="w-14 h-14 rounded-xl object-cover"
                style={{ border: `1px solid ${theme.borderColor}` }}
              />
            </div>
          )}
          <p className="text-sm font-medium mb-2" style={{ color: theme.textTertiary }}>
            {product.name}
          </p>
          <h1
            className="text-3xl sm:text-4xl font-bold mb-3"
            style={{ color: theme.textPrimary }}
          >
            {title}
          </h1>
          <p
            className="text-base sm:text-lg max-w-2xl mx-auto"
            style={{ color: theme.textSecondary }}
          >
            {subtitle}
          </p>
        </div>

        {/* Stats Bar */}
        {proofCount > 0 && (
          <div className="mb-10 max-w-xl mx-auto">
            <StatsBar
              proofCount={proofCount}
              verifiedCount={verifiedCount}
              avgRating={avgRating}
              theme={theme}
            />
          </div>
        )}

        {/* Layout: form-hero — no proofs, form is center stage */}
        {layout === "form-hero" && showForm && (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-6">
              <h2 className="text-xl font-semibold" style={{ color: theme.textPrimary }}>
                {formHeading}
              </h2>
              <p className="text-sm mt-1" style={{ color: theme.textSecondary }}>
                Be the first to share your experience!
              </p>
            </div>
            <ProofPageForm productSlug={slug} productName={product.name} theme={theme} />
          </div>
        )}

        {/* Layout: small-wall — small wall + prominent form */}
        {layout === "small-wall" && (
          <>
            <div className="mb-12">
              <WallMasonry
                proofs={wallProofs}
                theme={theme}
                columns={columns}
                spacing={16}
                borderRadius={12}
                showSourceBadges
                showVerifiedTags
                showTimeContext
              />
            </div>
            {showForm && (
              <div className="max-w-lg mx-auto">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex-1 h-px" style={{ background: theme.borderColor }} />
                  <h2 className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
                    {formHeading}
                  </h2>
                  <div className="flex-1 h-px" style={{ background: theme.borderColor }} />
                </div>
                <ProofPageForm productSlug={slug} productName={product.name} theme={theme} />
              </div>
            )}
          </>
        )}

        {/* Layout: wall-primary — wall is primary, form below */}
        {layout === "wall-primary" && (
          <>
            <div className="mb-12">
              <WallMasonry
                proofs={wallProofs}
                theme={theme}
                columns={columns}
                spacing={16}
                borderRadius={12}
                showSourceBadges
                showVerifiedTags
                showTimeContext
              />
            </div>
            {showForm && (
              <div className="max-w-lg mx-auto">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex-1 h-px" style={{ background: theme.borderColor }} />
                  <h2 className="text-lg font-semibold" style={{ color: theme.textPrimary }}>
                    {formHeading}
                  </h2>
                  <div className="flex-1 h-px" style={{ background: theme.borderColor }} />
                </div>
                <ProofPageForm productSlug={slug} productName={product.name} theme={theme} />
              </div>
            )}
          </>
        )}

        {/* Layout: wall-dominates — large wall, form at bottom */}
        {layout === "wall-dominates" && (
          <>
            <div className="mb-14">
              <WallMasonry
                proofs={wallProofs}
                theme={theme}
                columns={columns}
                spacing={16}
                borderRadius={12}
                showSourceBadges
                showVerifiedTags
                showTimeContext
              />
            </div>
            {showForm && (
              <div className="max-w-lg mx-auto">
                <div className="flex items-center gap-4 mb-8">
                  <div className="flex-1 h-px" style={{ background: theme.borderColor }} />
                  <h2 className="text-sm font-medium uppercase tracking-wider" style={{ color: theme.textTertiary }}>
                    {formHeading}
                  </h2>
                  <div className="flex-1 h-px" style={{ background: theme.borderColor }} />
                </div>
                <ProofPageForm productSlug={slug} productName={product.name} theme={theme} />
              </div>
            )}
          </>
        )}

        {/* Powered by ShipProof footer */}
        {showBranding && (
          <div className="mt-16 text-center">
            <a
              href="https://shipproof.io"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs transition-opacity hover:opacity-80"
              style={{ color: theme.textTertiary }}
            >
              Powered by
              <span className="font-semibold" style={{ color: theme.textSecondary }}>
                ShipProof
              </span>
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
