import { fetchPublicWallProofs } from "@/lib/api";
import { getCompanyLogoUrl } from "@/lib/company-logo";
import { CompanyLogoImg } from "@/components/company-logo";
import { ViewTracker } from "@/components/view-tracker";

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
        bgCard: "#1E2D3D", borderColor: "#2B3D4F",
        textPrimary: "#F1F1F3", textSecondary: "#9CA3AF", textTertiary: "#6B7280",
      };
    case "gray":
      return {
        bgCard: "#343440", borderColor: "#45454F",
        textPrimary: "#F1F1F3", textSecondary: "#B0B0B8", textTertiary: "#8A8A94",
      };
    case "light":
      return {
        bgCard: "#FFFFFF", borderColor: "#E5E7EB",
        textPrimary: "#111827", textSecondary: "#6B7280", textTertiary: "#9CA3AF",
      };
    default: // dark
      return {
        bgCard: "#1A1A1F", borderColor: "#2A2A30",
        textPrimary: "#F1F1F3", textSecondary: "#9CA3AF", textTertiary: "#6B7280",
      };
  }
}

export default async function EmbedWallPage({
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
      <div className="p-4 text-center text-sm text-gray-500">
        Wall not found.
      </div>
    );
  }

  const { wall, product, proofs } = data;
  const t = getThemeColors(wall.theme);
  const radius = `${wall.border_radius}px`;
  const spacing = `${wall.card_spacing}px`;

  return (
    <div
      id="shipproof-embed"
      style={{
        margin: 0,
        padding: "16px",
        background: "transparent",
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <ViewTracker entityType="wall" slug={slug} />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
var lastH=0;
function send(){
  var el=document.getElementById("shipproof-embed");
  if(el&&window.parent!==window){
    var h=el.scrollHeight;
    if(h!==lastH){lastH=h;window.parent.postMessage({type:"shipproof-resize",height:h},"*")}
  }
}
if(document.readyState==="complete")send();
else window.addEventListener("load",send);
window.addEventListener("resize",function(){send()});
var retryCount=0;var retryId=setInterval(function(){send();retryCount++;if(retryCount>=10)clearInterval(retryId)},500);
})();`,
        }}
      />

      {proofs.length === 0 ? (
        <div className="text-center py-12" style={{ color: t.textTertiary }}>
          No proofs yet.
        </div>
      ) : (
        <div
          className="columns-1 sm:columns-2 lg:columns-3"
          style={{ columnGap: spacing }}
        >
          {proofs.map((proof) => {
            const companyLogoUrl = getCompanyLogoUrl(proof.author_title);
            return (
              <div
                key={proof.id}
                className="break-inside-avoid p-5 relative"
                style={{
                  marginBottom: spacing,
                  borderRadius: radius,
                  border: `1px solid ${t.borderColor}`,
                  background: t.bgCard,
                }}
              >
                {companyLogoUrl && (
                  <CompanyLogoImg url={companyLogoUrl} />
                )}
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
                    <div className="text-sm font-medium" style={{ color: t.textPrimary }}>
                      {proof.author_name}
                    </div>
                    {proof.author_title && (
                      <div className="text-xs" style={{ color: t.textTertiary }}>
                        {proof.author_title}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                {proof.content_text && (
                  <p className="text-sm leading-relaxed" style={{ color: t.textSecondary }}>
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
                      border: `1px solid ${t.borderColor}`,
                    }}
                  />
                )}

                {/* Date */}
                <div className="mt-3 text-xs" style={{ color: t.textTertiary }}>
                  {new Date(proof.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Branding */}
      {wall.show_branding && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "4px",
            marginTop: "16px",
            fontSize: "11px",
            color: t.textTertiary,
          }}
        >
          <a
            href="https://shipproof.io"
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: "3px", color: "#6366F1", textDecoration: "none" }}
          >
            <svg width="16" height="16" viewBox="0 0 64 64">
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
