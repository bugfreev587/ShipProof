import { fetchPublicProofs, fetchPublicSpaceProofs } from "@/lib/api";
import { getThemeColors, type DashboardTheme } from "@/lib/theme-colors";
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
  const cardWidth = widget.card_size || 340;
  const cardHeight = 240;
  const textFontSize = widget.text_font_size || 14;
  const textFont = widget.text_font || "Inter";
  const textBold = widget.text_bold || false;
  const maxItems = widget.max_items || proofs.length;

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
      <style dangerouslySetInnerHTML={{ __html: `.proof-card:hover { border-color: ${t.borderHover} !important; box-shadow: 0 4px 20px ${t.borderHover}40 !important; transform: translateY(-2px); }` }} />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){
var cw=${cardWidth},sp=${widget.card_spacing},page=0,totalCards=0,perPage=1,lastH=0,resizeTimer=0;
function getTrack(){return document.getElementById("shipproof-track")}
function getViewport(){return document.getElementById("shipproof-viewport")}
function adjust(){
  var vp=getViewport();if(!vp)return;
  var row=vp.parentElement;
  var pw=row.parentElement.clientWidth-80;
  totalCards=${Math.min(proofs.length, maxItems)};
  perPage=Math.max(1,Math.floor((pw+sp)/(cw+sp)));
  var maxW=perPage*cw+(perPage-1)*sp;
  vp.style.maxWidth=maxW+"px";
  if(page>Math.max(0,Math.ceil(totalCards/perPage)-1))page=Math.max(0,Math.ceil(totalCards/perPage)-1);
  slideTo();
  updateDots();
  updateArrows();
  send();
}
function slideTo(){
  var track=getTrack();if(!track)return;
  var offset=page*(perPage*cw+perPage*sp);
  track.style.transform="translateX(-"+offset+"px)";
}
function totalPages(){return Math.max(1,Math.ceil(totalCards/perPage))}
function updateDots(){
  var dc=document.getElementById("shipproof-dots");
  if(!dc)return;
  var tp=totalPages();
  dc.innerHTML="";
  if(tp<=1){dc.style.display="none";return;}
  dc.style.display="flex";
  for(var i=0;i<tp;i++){
    var d=document.createElement("span");
    d.style.cssText="width:8px;height:8px;border-radius:50%;cursor:pointer;transition:background 0.2s;";
    d.style.background=i===page?"${t.textSecondary}":"${t.border}";
    d.setAttribute("data-page",i);
    d.addEventListener("click",function(){page=parseInt(this.getAttribute("data-page"));slideTo();updateDots();send()});
    dc.appendChild(d);
  }
}
function updateArrows(){
  var la=document.getElementById("shipproof-arrow-left");
  var ra=document.getElementById("shipproof-arrow-right");
  var tp=totalPages();
  if(la)la.style.display=tp<=1?"none":"flex";
  if(ra)ra.style.display=tp<=1?"none":"flex";
}
function send(){
  var el=document.getElementById("shipproof-embed");
  if(el&&window.parent!==window){var h=el.scrollHeight;if(h!==lastH){lastH=h;window.parent.postMessage({type:"shipproof-resize",height:h},"*")}}
}
window.__shipproof_prev=function(){page=(page-1+totalPages())%totalPages();slideTo();updateDots();send()};
window.__shipproof_next=function(){page=(page+1)%totalPages();slideTo();updateDots();send()};
function vcenter(){
  var el=document.getElementById("shipproof-embed");if(!el)return;
  var wh=window.innerHeight,eh=el.scrollHeight;
  if(wh>eh+20){el.style.paddingTop=Math.floor((wh-eh)/2)+"px"}
}
function debouncedAdjust(){clearTimeout(resizeTimer);resizeTimer=setTimeout(adjust,100)}
if(document.readyState==="complete"){adjust();vcenter()}else window.addEventListener("load",function(){adjust();vcenter()});
window.addEventListener("resize",debouncedAdjust);
var retryCount=0;var retryId=setInterval(function(){var el=document.getElementById("shipproof-embed");if(el&&window.parent!==window){window.parent.postMessage({type:"shipproof-resize",height:el.scrollHeight},"*")}retryCount++;if(retryCount>=10)clearInterval(retryId)},500);
})();`,
        }}
      />

      {/* Carousel row: arrow + cards + arrow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          justifyContent: "center",
          margin: "0 auto",
        }}
      >
        {/* Left arrow */}
        <button
          id="shipproof-arrow-left"
          style={{
            flexShrink: 0,
            zIndex: 10,
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: `1px solid ${t.border}`,
            background: t.bgSurface,
            color: t.textSecondary,
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "16px",
            lineHeight: 1,
          }}
          dangerouslySetInnerHTML={{ __html: `<span onclick="__shipproof_prev()" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">\u2039</span>` }}
        />

        {/* Cards viewport */}
        <div
          id="shipproof-viewport"
          style={{
            overflow: "hidden",
            padding: "4px 0",
          }}
        >
          <div
            id="shipproof-track"
            style={{
              display: "flex",
              gap: spacing,
              transition: "transform 0.4s ease",
            }}
          >
            {proofs.slice(0, maxItems).map((proof) => {
              const authorTitle = pgStr(proof.author_title);
              const contentText = pgStr(proof.content_text);
              const contentImageUrl = pgStr(proof.content_image_url);
              const companyLogoUrl = getCompanyLogoUrl(authorTitle);
              return (
              <div
                key={proof.id}
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
                {companyLogoUrl && (
                  <CompanyLogoImg url={companyLogoUrl} />
                )}

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
            })}
          </div>
        </div>

        {/* Right arrow */}
        <button
          id="shipproof-arrow-right"
          style={{
            flexShrink: 0,
            zIndex: 10,
            width: "28px",
            height: "28px",
            borderRadius: "50%",
            border: `1px solid ${t.border}`,
            background: t.bgSurface,
            color: t.textSecondary,
            display: "none",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: "16px",
            lineHeight: 1,
          }}
          dangerouslySetInnerHTML={{ __html: `<span onclick="__shipproof_next()" style="display:flex;align-items:center;justify-content:center;width:100%;height:100%">\u203A</span>` }}
        />
      </div>

      {/* Dot indicators */}
      <div
        id="shipproof-dots"
        style={{
          display: "none",
          justifyContent: "center",
          gap: "6px",
          paddingTop: "8px",
        }}
      />

      {widget.show_branding && (
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
