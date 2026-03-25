import { fetchPublicProofs, fetchPublicSpaceProofs } from "@/lib/api";
import { getThemeColors, type DashboardTheme } from "@/lib/theme-colors";
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

interface WidgetSettings {
  theme: string;
  show_platform_icon: boolean;
  border_radius: number;
  card_spacing: number;
  show_branding: boolean;
  max_items?: number;
  visible_count?: number;
  card_size?: number;
  card_height?: number;
  text_font_size?: number;
  text_font?: string;
  text_bold?: boolean;
  bg_color?: string;
  bg_opacity?: number;
  layout?: string;
  rows?: number;
  width_percent?: number;
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

function ProofCard({
  proof,
  widget,
  t,
  radius,
  cardWidth,
  cardHeight,
  textFontSize,
  textFont,
  textBold,
}: {
  proof: ProofItem;
  widget: WidgetSettings;
  t: ReturnType<typeof getThemeColors>;
  radius: string;
  cardWidth: number;
  cardHeight: number;
  textFontSize: number;
  textFont: string;
  textBold: boolean;
}) {
  const authorTitle = pgStr(proof.author_title);
  const contentText = pgStr(proof.content_text);
  const contentImageUrl = pgStr(proof.content_image_url);
  const companyLogoUrl = getCompanyLogoUrl(authorTitle);
  return (
    <div
      className="proof-card"
      style={{
        width: `${cardWidth}px`,
        minWidth: `${cardWidth}px`,
        height: `${cardHeight}px`,
        overflow: "hidden",
        padding: "20px",
        borderRadius: radius,
        border: `1px solid ${t.border}`,
        background: t.bgSurface,
        flexShrink: 0,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        transition: "border-color 0.2s, box-shadow 0.2s, transform 0.2s",
        cursor: "pointer",
      }}
    >
      {companyLogoUrl && <CompanyLogoImg url={companyLogoUrl} />}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        {widget.show_platform_icon && (
          <span
            className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-[12px] font-bold text-white flex-shrink-0 ${PLATFORM_COLORS[proof.source_platform] || "bg-gray-500"}`}
          >
            {PLATFORM_LABELS[proof.source_platform] || "O"}
          </span>
        )}
        <div>
          <div
            style={{
              fontSize: "15px",
              fontWeight: 700,
              color: t.textPrimary,
            }}
          >
            {proof.author_name}
          </div>
          {authorTitle && (
            <div
              style={{
                fontSize: "13px",
                color: t.textTertiary,
                marginTop: "3px",
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
            fontSize: `${textFontSize}px`,
            lineHeight: "1.6",
            color: t.textSecondary,
            margin: 0,
            fontFamily: textFont,
            fontWeight: textBold ? 700 : 400,
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
}

function BrandingBadge({ t }: { t: ReturnType<typeof getThemeColors> }) {
  return (
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
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "3px",
          color: "#6366F1",
          textDecoration: "none",
        }}
      >
        <svg width="16" height="16" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="#6366F1" />
          <path d="M32,46 C32,46 16,35 16,26 C16,20 19,17 24,17 C27,17 30,19 32,21 C34,19 37,17 40,17 C45,17 48,20 48,26 C48,35 32,46 32,46Z" fill="white" />
        </svg>
        ShipProof
      </a>
    </div>
  );
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
  const cardWidth = widget.card_size || 340;
  const cardHeight = 240;
  const textFontSize = widget.text_font_size || 14;
  const textFont = widget.text_font || "Inter";
  const textBold = widget.text_bold || false;
  const maxItems = widget.max_items || proofs.length;
  const layout = widget.layout || "carousel";
  const rows = Math.max(1, Math.min(4, widget.rows || 1));
  const widthPercent = Math.max(50, Math.min(100, widget.width_percent || 100));

  // Compute container background from bg_color + bg_opacity
  let containerBg = "transparent";
  if (widget.bg_color) {
    const hex = widget.bg_color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = (widget.bg_opacity ?? 100) / 100;
    containerBg = `rgba(${r},${g},${b},${a})`;
  }

  const displayProofs = proofs.slice(0, maxItems);

  const cardProps = {
    widget,
    t,
    radius,
    cardWidth,
    cardHeight,
    textFontSize,
    textFont,
    textBold,
  };

  if (layout === "marquee") {
    // Split proofs across rows
    const rowProofs: ProofItem[][] = Array.from({ length: rows }, () => []);
    displayProofs.forEach((proof, i) => {
      rowProofs[i % rows].push(proof);
    });

    // Build CSS for each row with alternating directions
    const rowStyles = rowProofs.map((rp, idx) => {
      const minCards = Math.max(6, rp.length);
      const repeatCount = rp.length > 0 ? Math.ceil(minCards / rp.length) : 1;
      const filledCount = repeatCount * rp.length;
      const duration = filledCount * 4.5;
      const direction = idx % 2 === 0 ? "marquee-left" : "marquee-right";
      return { filledCount, repeatCount, duration, direction, proofs: rp };
    });

    return (
      <div
        id="shipproof-embed"
        style={{
          margin: 0,
          padding: spacing,
          background: containerBg,
          fontFamily:
            'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        }}
      >
        <ViewTracker entityType="space" slug={slug} />
        <style
          dangerouslySetInnerHTML={{
            __html: `
.proof-card:hover { border-color: ${t.borderHover} !important; box-shadow: 0 4px 20px ${t.borderHover}40 !important; transform: translateY(-2px); }
@keyframes marquee-left {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
@keyframes marquee-right {
  0% { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
.marquee-container {
  overflow: hidden;
  width: 100%;
  mask-image: none;
  -webkit-mask-image: none;
}
.marquee-track {
  display: flex;
  gap: ${spacing};
  width: max-content;
}
.marquee-track:hover {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  .marquee-track {
    animation: none !important;
    overflow-x: auto;
  }
  .marquee-container {
    overflow-x: auto;
    mask-image: none;
    -webkit-mask-image: none;
  }
}
`,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
var lastH=0;
function send(){
  var el=document.getElementById("shipproof-embed");
  if(el&&window.parent!==window){var h=el.scrollHeight;if(h!==lastH){lastH=h;window.parent.postMessage({type:"shipproof-resize",height:h},"*")}}
}
if(document.readyState==="complete")send();else window.addEventListener("load",send);
var retryCount=0;var retryId=setInterval(function(){send();retryCount++;if(retryCount>=10)clearInterval(retryId)},500);
})();`,
          }}
        />

        <div style={{ display: "flex", flexDirection: "column", gap: spacing, width: `${widthPercent}%`, margin: "0 auto" }}>
          {rowStyles.map((row, rowIdx) => {
            if (row.proofs.length === 0) return null;
            const filled: ProofItem[] = [];
            for (let i = 0; i < row.repeatCount; i++) filled.push(...row.proofs);
            return (
              <div key={rowIdx} className="marquee-container">
                <div
                  className="marquee-track"
                  style={{ animation: `${row.direction} ${row.duration}s linear infinite` }}
                >
                  {filled.map((proof, i) => (
                    <ProofCard key={`a-${rowIdx}-${i}`} proof={proof} {...cardProps} />
                  ))}
                  {filled.map((proof, i) => (
                    <ProofCard key={`b-${rowIdx}-${i}`} proof={proof} {...cardProps} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {widget.show_branding && <BrandingBadge t={t} />}
      </div>
    );
  }

  // Carousel layout (default) — multi-row with independent scrollable rows
  // Split proofs across rows
  const rowProofs: ProofItem[][] = Array.from({ length: rows }, () => []);
  displayProofs.forEach((proof, i) => {
    rowProofs[i % rows].push(proof);
  });

  return (
    <div
      id="shipproof-embed"
      style={{
        margin: 0,
        padding: spacing,
        background: containerBg,
        fontFamily:
          'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <ViewTracker entityType="space" slug={slug} />
      <style
        dangerouslySetInnerHTML={{
          __html: `
.proof-card:hover { border-color: ${t.borderHover} !important; box-shadow: 0 4px 20px ${t.borderHover}40 !important; transform: translateY(-2px); }
.carousel-row { overflow-x: auto; scroll-snap-type: x mandatory; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.carousel-row::-webkit-scrollbar { display: none; }
`,
        }}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
var lastH=0;
function send(){
  var el=document.getElementById("shipproof-embed");
  if(el&&window.parent!==window){var h=el.scrollHeight;if(h!==lastH){lastH=h;window.parent.postMessage({type:"shipproof-resize",height:h},"*")}}
}
if(document.readyState==="complete")send();else window.addEventListener("load",send);
var retryCount=0;var retryId=setInterval(function(){send();retryCount++;if(retryCount>=10)clearInterval(retryId)},500);
})();`,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: spacing, width: `${widthPercent}%`, margin: "0 auto" }}>
        {rowProofs.map((rp, rowIdx) => {
          if (rp.length === 0) return null;
          return (
            <div key={rowIdx} className="carousel-row">
              <div style={{ display: "flex", gap: spacing }}>
                {rp.map((proof) => (
                  <div key={proof.id} style={{ scrollSnapAlign: "start" }}>
                    <ProofCard proof={proof} {...cardProps} />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {widget.show_branding && <BrandingBadge t={t} />}
    </div>
  );
}
