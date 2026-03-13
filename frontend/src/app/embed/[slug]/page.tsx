import { fetchPublicProofs } from "@/lib/api";

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

export default async function EmbedPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let data;
  try {
    data = await fetchPublicProofs(slug);
  } catch {
    return (
      <div className="p-4 text-center text-sm text-gray-500">
        Widget not found.
      </div>
    );
  }

  const { proofs, widget } = data;
  const isDark = widget.theme === "dark";
  const radius = `${widget.border_radius}px`;
  const spacing = `${widget.card_spacing}px`;

  return (
    <html>
      <body
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
          {proofs.map((proof) => (
            <div
              key={proof.id}
              style={{
                minWidth: "280px",
                maxWidth: "320px",
                padding: "16px",
                borderRadius: radius,
                border: `1px solid ${isDark ? "#2A2A30" : "#E5E7EB"}`,
                background: isDark ? "#1A1A1F" : "#FFFFFF",
                flexShrink: 0,
              }}
            >
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
                      color: isDark ? "#F1F1F3" : "#111827",
                    }}
                  >
                    {proof.author_name}
                  </div>
                  {proof.author_title && (
                    <div
                      style={{
                        fontSize: "11px",
                        color: isDark ? "#6B7280" : "#9CA3AF",
                      }}
                    >
                      {proof.author_title}
                    </div>
                  )}
                </div>
              </div>

              {proof.content_text && (
                <p
                  style={{
                    fontSize: "13px",
                    lineHeight: "1.5",
                    color: isDark ? "#9CA3AF" : "#4B5563",
                    margin: 0,
                  }}
                >
                  {proof.content_text}
                </p>
              )}

              {proof.content_image_url && (
                <img
                  src={proof.content_image_url.replace(/^https?:\/\/https?:\/\//, "https://")}
                  alt="Proof"
                  style={{
                    marginTop: "8px",
                    maxWidth: "100%",
                    borderRadius: `${Math.max(widget.border_radius - 4, 0)}px`,
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {widget.show_branding && (
          <div
            style={{
              textAlign: "center",
              marginTop: "8px",
              fontSize: "11px",
              color: isDark ? "#6B7280" : "#9CA3AF",
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
      </body>
    </html>
  );
}
