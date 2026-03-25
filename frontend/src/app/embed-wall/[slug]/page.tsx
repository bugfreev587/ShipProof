import { fetchPublicWallProofs } from "@/lib/api";
import { ViewTracker } from "@/components/view-tracker";
import WallPublic from "@/components/wall-of-proof/wall-public";
import { getWallThemeColors } from "@/components/wall-of-proof/types";
import type { WallProof, WallDisplayConfig } from "@/components/wall-of-proof/types";

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

function toWallProof(proof: {
  id: string;
  source_platform: string;
  author_name: string;
  author_title: string | null;
  author_avatar_url: string | null;
  content_text: string | null;
  content_image_url: string | null;
  created_at: string;
}): WallProof {
  return {
    id: proof.id,
    author_name: proof.author_name,
    author_title: pgStr(proof.author_title),
    author_avatar_url: pgStr(proof.author_avatar_url),
    content_text: pgStr(proof.content_text),
    content_image_url: pgStr(proof.content_image_url),
    source_platform: proof.source_platform,
    created_at: proof.created_at,
  };
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
  const theme = getWallThemeColors(wall.theme);
  const wallProofs = proofs.map(toWallProof);
  const headerColor =
    wall.transparent_bg && wall.header_text_color
      ? wall.header_text_color
      : theme.textPrimary;
  const headerSubColor =
    wall.transparent_bg && wall.header_text_color
      ? wall.header_text_color + "99"
      : theme.textSecondary;

  const config: WallDisplayConfig = {
    layout: "masonry",
    theme: (wall.theme as WallDisplayConfig["theme"]) || "dark",
    columns: 3,
    showSourceBadges: wall.show_platform_icon,
    showVerifiedTags: true,
    showTimeContext: true,
    showBranding: wall.show_branding,
    borderRadius: wall.border_radius,
    cardSpacing: wall.card_spacing,
    showPlatformIcon: wall.show_platform_icon,
  };

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
if(window.parent===window)return;
var lastH=0;
function getHeight(){
  var el=document.getElementById("shipproof-embed");
  var h1=el?el.scrollHeight:0;
  var h2=document.documentElement.scrollHeight;
  var h3=document.body.scrollHeight;
  return Math.max(h1,h2,h3);
}
function send(force){
  var h=getHeight();
  if(h>0&&(force||h!==lastH)){lastH=h;window.parent.postMessage({type:"shipproof-resize",height:h},"*")}
}
if(typeof ResizeObserver!=="undefined"){
  document.addEventListener("DOMContentLoaded",function(){
    new ResizeObserver(function(){send()}).observe(document.body);
  });
}
if(document.readyState==="complete")send(true);
else window.addEventListener("load",function(){send(true)});
window.addEventListener("resize",function(){send()});
document.addEventListener("DOMContentLoaded",function(){
  var imgs=document.querySelectorAll("img");
  for(var i=0;i<imgs.length;i++)imgs[i].addEventListener("load",function(){send()});
});
setInterval(function(){send(true)},1000);
})();`,
        }}
      />

      {/* Custom header for embed (preserves transparent bg logic) */}
      {wall.show_header !== false && (
        <div style={{ textAlign: "center", padding: "24px 16px 32px" }}>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: 700,
              color: headerColor,
              marginBottom: "8px",
            }}
          >
            {wall.name}
          </h1>
          <p style={{ fontSize: "14px", color: headerSubColor, margin: 0 }}>
            {wall.subtitle || (
              <>
                What people are saying about{" "}
                <span style={{ fontWeight: 500, color: headerColor }}>
                  {product.name}
                </span>
              </>
            )}
          </p>
        </div>
      )}

      {/* Wall content (without header, since we render it above) */}
      <WallPublic proofs={wallProofs} config={config} />
    </div>
  );
}
