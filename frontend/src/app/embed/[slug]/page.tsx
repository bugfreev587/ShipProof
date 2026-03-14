import { fetchPublicProofs, fetchPublicSpaceProofs } from "@/lib/api";
import { getThemeColors, type DashboardTheme } from "@/lib/theme-colors";
import { getCompanyLogoUrl } from "@/lib/company-logo";
import { CompanyLogoImg } from "@/components/company-logo";

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

interface WidgetSettings {
  theme: string;
  show_platform_icon: boolean;
  border_radius: number;
  card_spacing: number;
  show_branding: boolean;
}

type PgText = { String: string; Valid: boolean } | string | null;

function pgStr(v: PgText): string | null {
  if (v == null) return null;
  if (typeof v === "string") return v || null;
  return v.Valid ? v.String : null;
}

interface ProofItem {
  id: string;
  source_platform: string;
  author_name: string;
  author_title: PgText;
  content_text: PgText;
  content_image_url: PgText;
}

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let proofs: ProofItem[] = [];
  let widget: WidgetSettings;

  // Try space first, fall back to product embed
  try {
    const spaceData = await fetchPublicSpaceProofs(slug);
    proofs = spaceData.proofs;
    widget = spaceData.space;
  } catch {
    try {
      const productData = await fetchPublicProofs(slug);
      proofs = productData.proofs;
      widget = productData.widget;
    } catch {
      return (
        <div className="p-4 text-center text-sm text-gray-500">
          Widget not found.
        </div>
      );
    }
  }

  const t = getThemeColors((widget.theme || "dark") as DashboardTheme);
  const radius = `${widget.border_radius}px`;
  const spacing = `${widget.card_spacing}px`;

  return (
    <div
      style={{
        margin: 0,
        padding: spacing,
        background: "transparent",
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
        <div
          style={{
            display: "flex",
            gap: spacing,
            overflowX: "auto",
            paddingBottom: "8px",
          }}
        >
          {proofs.map((proof) => {
            const authorTitle = pgStr(proof.author_title);
            const contentText = pgStr(proof.content_text);
            const contentImageUrl = pgStr(proof.content_image_url);
            const companyLogoUrl = getCompanyLogoUrl(authorTitle);
            return (
            <div
              key={proof.id}
              style={{
                minWidth: "280px",
                maxWidth: "320px",
                padding: "16px",
                borderRadius: radius,
                border: `1px solid ${t.border}`,
                background: t.bgSurface,
                flexShrink: 0,
                position: "relative",
              }}
            >
              {companyLogoUrl && (
                <CompanyLogoImg url={companyLogoUrl} />
              )}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "8px",
                }}
              >
                {widget.show_platform_icon && (
                  <span
                    className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white ${PLATFORM_COLORS[proof.source_platform] || "bg-gray-500"}`}
                  >
                    {PLATFORM_LABELS[proof.source_platform] || "O"}
                  </span>
                )}
                <div>
                  <div
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: t.textPrimary,
                    }}
                  >
                    {proof.author_name}
                  </div>
                  {authorTitle && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: t.textTertiary,
                      }}
                    >
                      {authorTitle}
                    </div>
                  )}
                </div>
              </div>

              {contentText && (
                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: "1.5",
                    color: t.textSecondary,
                    margin: 0,
                  }}
                >
                  {contentText}
                </p>
              )}

              {contentImageUrl && (
                <img
                  src={contentImageUrl.replace(/^https?:\/\/https?:\/\//, "https://")}
                  alt="Proof"
                  style={{
                    marginTop: "8px",
                    maxWidth: "100%",
                    borderRadius: `${Math.max(widget.border_radius - 4, 0)}px`,
                  }}
                />
              )}
            </div>
            );
          })}
        </div>

        {widget.show_branding && (
          <div
            style={{
              textAlign: "center",
              marginTop: "8px",
              fontSize: "11px",
              color: t.textTertiary,
            }}
          >
            Powered by{" "}
            <a
              href="https://shipproof.io"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#6366F1", textDecoration: "none" }}
            >
              ShipProof
            </a>
          </div>
        )}
    </div>
  );
}
