"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getEmbed,
  getProduct,
  listProofs,
  listEmbedProofs,
  updateEmbedConfig,
  addProofToEmbed,
  removeProofFromEmbed,
  getCurrentUser,
  type Embed,
  type Product,
  type Proof,
} from "@/lib/api";
import { getCompanyLogoUrl } from "@/lib/company-logo";
import { CompanyLogoImg } from "@/components/company-logo";
import { getThemeColors, type DashboardTheme } from "@/lib/theme-colors";

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

const EMBED_DEFAULTS: Partial<Embed> = {
  theme: "dark",
  border_radius: 12,
  card_spacing: 16,
  card_size: 300,
  card_height: 0,
  show_platform_icon: true,
  show_branding: true,
  text_font_size: 14,
  text_font: "Inter",
  text_bold: false,
  bg_color: "",
  bg_opacity: 100,
  rows: 1,
  width_percent: 100,
  show_header: true,
  subtitle: "",
  transparent_bg: false,
  header_text_color: "",
};

export default function EmbedEditPage() {
  const { id: productId, eid: embedId } = useParams<{ id: string; eid: string }>();
  const { getToken } = useAuth();

  const [embed, setEmbed] = useState<Embed | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [allProofs, setAllProofs] = useState<Proof[]>([]);
  const [embedProofIds, setEmbedProofIds] = useState<Set<string>>(new Set());
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "business">("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [e, p, proofs, epList, user] = await Promise.all([
        getEmbed(embedId, token),
        getProduct(productId, token),
        listProofs(productId, token),
        listEmbedProofs(embedId, token),
        getCurrentUser(token),
      ]);
      setEmbed({ ...EMBED_DEFAULTS, ...e } as Embed);
      setProduct(p);
      setAllProofs(proofs);
      setEmbedProofIds(new Set(epList.map((pr) => pr.id)));
      setUserPlan(user.plan);
    } catch {
      setError("Failed to load embed data.");
    } finally {
      setLoading(false);
    }
  }, [getToken, productId, embedId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const isStrip = embed?.layout === "inline_strip";

  const handleConfigChange = (updates: Partial<Embed>) => {
    if (!embed) return;
    const next = { ...embed, ...updates };
    setEmbed(next);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const token = await getToken();
      if (!token) return;
      try {
        await updateEmbedConfig(
          embedId,
          {
            theme: next.theme,
            border_radius: next.border_radius,
            card_spacing: next.card_spacing,
            show_platform_icon: next.show_platform_icon,
            show_branding: next.show_branding,
            bg_color: next.bg_color,
            bg_opacity: next.bg_opacity,
            transparent_bg: next.transparent_bg,
            header_text_color: next.header_text_color,
            subtitle: next.subtitle,
            show_header: next.show_header,
            card_size: next.card_size,
            card_height: next.card_height,
            text_font_size: next.text_font_size,
            text_font: next.text_font,
            text_bold: next.text_bold,
            rows: next.rows || 1,
            width_percent: next.width_percent || 100,
            auto_scroll: next.auto_scroll,
          },
          token,
        );
      } catch {
        // ignore
      }
    }, 500);
  };

  const handleToggleProof = async (proofId: string) => {
    const token = await getToken();
    if (!token) return;
    try {
      if (embedProofIds.has(proofId)) {
        await removeProofFromEmbed(embedId, proofId, token);
        setEmbedProofIds((prev) => {
          const n = new Set(prev);
          n.delete(proofId);
          return n;
        });
      } else {
        await addProofToEmbed(embedId, proofId, embedProofIds.size, token);
        setEmbedProofIds((prev) => new Set(prev).add(proofId));
      }
    } catch {
      // ignore
    }
  };

  const handleCopyEmbed = () => {
    if (!embed) return;
    const code = `<script type="text/javascript" src="https://shipproof.io/js/embed.js"></script>\n<iframe id="shipproof-${embed.slug}" src="https://shipproof.io/embed/${embed.slug}" frameborder="0" scrolling="no" width="100%"></iframe>`;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-secondary)]">
        Loading...
      </div>
    );
  }

  if (error || !embed || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          {error || "Embed not found."}
        </div>
        <Link
          href={`/dashboard/products/${productId}?tab=embeds`}
          className="mt-4 inline-block text-sm text-[#6366F1] hover:text-[#818CF8]"
        >
          Back to product
        </Link>
      </div>
    );
  }

  const selectedProofs = allProofs.filter((p) => embedProofIds.has(p.id));

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      {/* Header */}
      <Link
        href={`/dashboard/products/${productId}?tab=embeds`}
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to {product.name}
      </Link>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">
          Edit Embed: {embed.name}
        </h1>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
          isStrip
            ? "bg-[#6366F1]/15 text-[#818CF8]"
            : "bg-emerald-500/15 text-emerald-400"
        }`}>
          {isStrip ? "Inline Strip" : "Wall Grid"}
        </span>
      </div>

      <div className="flex gap-6" style={{ minHeight: "calc(100vh - 200px)" }}>
        {/* Left panel */}
        <div className="w-1/4 min-w-[280px] flex-shrink-0 space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-5">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Configuration</h2>

            {/* === Inline Strip controls === */}
            {isStrip && (
              <>
                {/* Layout mode */}
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-2">Layout</label>
                  <div className="flex gap-2">
                    {([
                      { value: false, label: "Carousel", desc: "Manual scroll" },
                      { value: true, label: "Marquee", desc: "Auto-scrolling" },
                    ] as const).map((opt) => (
                      <button
                        key={String(opt.value)}
                        onClick={() => handleConfigChange({ auto_scroll: opt.value })}
                        className={`flex-1 rounded-lg border px-2 py-2 text-left transition-all cursor-pointer ${
                          (embed.auto_scroll || false) === opt.value
                            ? "border-[#6366F1] bg-[#6366F1]/10"
                            : "border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]"
                        }`}
                      >
                        <span className={`block text-xs font-medium ${
                          (embed.auto_scroll || false) === opt.value ? "text-[#818CF8]" : "text-[var(--text-primary)]"
                        }`}>{opt.label}</span>
                        <span className="block text-[9px] text-[var(--text-tertiary)] mt-0.5">{opt.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rows */}
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-2">Rows: {embed.rows || 1}</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => handleConfigChange({ rows: n })}
                        className={`flex-1 rounded-lg border px-2 py-2 text-center transition-all cursor-pointer text-xs font-medium ${
                          (embed.rows || 1) === n
                            ? "border-[#6366F1] bg-[#6366F1]/10 text-[#818CF8]"
                            : "border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)] text-[var(--text-primary)]"
                        }`}
                      >{n}</button>
                    ))}
                  </div>
                </div>

                {/* Width */}
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Width: {embed.width_percent || 100}%</label>
                  <input type="range" min={50} max={100} value={embed.width_percent || 100}
                    onChange={(e) => handleConfigChange({ width_percent: Number(e.target.value) })} className="w-full" />
                </div>

                {/* Card Width */}
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Card Width: {embed.card_size}px</label>
                  <input type="range" min={200} max={420} value={embed.card_size}
                    onChange={(e) => handleConfigChange({ card_size: Number(e.target.value) })} className="w-full" />
                </div>

                {/* Card Height */}
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">
                    Card Height: {embed.card_height === 0 ? "Auto" : `${embed.card_height}px`}
                  </label>
                  <input type="range" min={0} max={500} step={10} value={embed.card_height}
                    onChange={(e) => handleConfigChange({ card_height: Number(e.target.value) })} className="w-full" />
                </div>

                {/* Text Font Size */}
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Text Size: {embed.text_font_size}px</label>
                  <input type="range" min={10} max={20} value={embed.text_font_size}
                    onChange={(e) => handleConfigChange({ text_font_size: Number(e.target.value) })} className="w-full" />
                </div>

                {/* Font */}
                <div>
                  <label className="block text-xs text-[var(--text-secondary)] mb-1">Font</label>
                  <select value={embed.text_font} onChange={(e) => handleConfigChange({ text_font: e.target.value })}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none">
                    <option value="Inter">Inter</option>
                    <option value="System UI">System UI</option>
                    <option value="Georgia">Georgia</option>
                    <option value="Merriweather">Merriweather</option>
                    <option value="JetBrains Mono">JetBrains Mono</option>
                  </select>
                </div>

                {/* Text Bold */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={embed.text_bold}
                    onChange={(e) => handleConfigChange({ text_bold: e.target.checked })}
                    className="rounded border-[var(--border)]" />
                  <span className="text-xs text-[var(--text-secondary)]">Bold text</span>
                </label>
              </>
            )}

            {/* === Wall Grid controls === */}
            {!isStrip && (
              <>
                {/* Show Header */}
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={embed.show_header}
                    onChange={(e) => handleConfigChange({ show_header: e.target.checked })}
                    className="rounded border-[var(--border)]" />
                  <span className="text-xs text-[var(--text-secondary)]">Show header</span>
                </label>

                {embed.show_header && (
                  <>
                    <div>
                      <label className="block text-xs text-[var(--text-secondary)] mb-1">Header</label>
                      <input type="text" value={embed.name}
                        onChange={(e) => {
                          setEmbed({ ...embed, name: e.target.value });
                          if (debounceRef.current) clearTimeout(debounceRef.current);
                          debounceRef.current = setTimeout(async () => {
                            const token = await getToken();
                            if (!token) return;
                            try {
                              const { updateEmbed } = await import("@/lib/api");
                              await updateEmbed(embedId, e.target.value, token);
                            } catch { /* ignore */ }
                          }, 500);
                        }}
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs text-[var(--text-secondary)] mb-1">Subtitle</label>
                      <input type="text" value={embed.subtitle}
                        onChange={(e) => handleConfigChange({ subtitle: e.target.value })}
                        placeholder="What people are saying about..."
                        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[#6366F1] focus:outline-none" />
                    </div>
                  </>
                )}
              </>
            )}

            {/* === Shared controls === */}

            {/* Theme */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Theme</label>
              <select value={embed.theme} onChange={(e) => handleConfigChange({ theme: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none">
                <option value="dark">Dark</option>
                <option value="dim">Dim</option>
                <option value="gray">Gray</option>
                <option value="light">Light</option>
              </select>
            </div>

            {/* Border Radius */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Border Radius: {embed.border_radius}px</label>
              <input type="range" min={0} max={24} value={embed.border_radius}
                onChange={(e) => handleConfigChange({ border_radius: Number(e.target.value) })} className="w-full" />
            </div>

            {/* Card Spacing */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Card Spacing: {embed.card_spacing}px</label>
              <input type="range" min={4} max={32} value={embed.card_spacing}
                onChange={(e) => handleConfigChange({ card_spacing: Number(e.target.value) })} className="w-full" />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                <input type="checkbox" checked={embed.show_platform_icon}
                  onChange={(e) => handleConfigChange({ show_platform_icon: e.target.checked })}
                  className="rounded border-[var(--border)]" />
                Show platform icons
              </label>

              <div>
                <label className={`flex items-center gap-2 text-sm ${
                  userPlan === "business" ? "text-[var(--text-primary)] cursor-pointer" : "text-[var(--text-tertiary)] cursor-not-allowed"
                }`}>
                  <input type="checkbox" checked={!embed.show_branding} disabled={userPlan !== "business"}
                    onChange={(e) => handleConfigChange({ show_branding: !e.target.checked })}
                    className="rounded border-[var(--border)]" />
                  Remove &quot;Powered by ShipProof&quot;
                </label>
                {userPlan !== "business" && (
                  <p className="text-[10px] text-[var(--text-tertiary)] ml-6 mt-0.5">Business plan only</p>
                )}
              </div>

              {/* Transparent bg — wall_grid only */}
              {!isStrip && (
                <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                  <input type="checkbox" checked={embed.transparent_bg}
                    onChange={(e) => handleConfigChange({ transparent_bg: e.target.checked, bg_color: "" })}
                    className="rounded border-[var(--border)]" />
                  Transparent background
                </label>
              )}
            </div>

            {/* Background Color */}
            {isStrip ? (
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Background Color</label>
                <div className="flex items-center gap-2">
                  <input type="color" value={embed.bg_color || "#0F0F10"}
                    onChange={(e) => handleConfigChange({ bg_color: e.target.value })}
                    className="h-8 w-8 rounded border border-[var(--border)] bg-transparent cursor-pointer" />
                  <input type="text" value={embed.bg_color || ""} placeholder="Default (transparent)"
                    onChange={(e) => handleConfigChange({ bg_color: e.target.value })}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none" />
                </div>
                {embed.bg_color && (
                  <div className="mt-2">
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">
                      Background Opacity: {embed.bg_opacity}%
                    </label>
                    <input type="range" min={0} max={100} value={embed.bg_opacity}
                      onChange={(e) => handleConfigChange({ bg_opacity: Number(e.target.value) })} className="w-full" />
                  </div>
                )}
              </div>
            ) : (
              <>
                {!embed.transparent_bg && (
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={embed.bg_color || "#0F0F10"}
                        onChange={(e) => handleConfigChange({ bg_color: e.target.value })}
                        className="h-8 w-8 rounded border border-[var(--border)] bg-transparent cursor-pointer" />
                      <input type="text" value={embed.bg_color || ""} placeholder="Default (theme)"
                        onChange={(e) => handleConfigChange({ bg_color: e.target.value })}
                        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none" />
                    </div>
                  </div>
                )}
                {embed.transparent_bg && (
                  <div>
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">Header Text Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={embed.header_text_color || "#111827"}
                        onChange={(e) => handleConfigChange({ header_text_color: e.target.value })}
                        className="h-8 w-8 rounded border border-[var(--border)] bg-transparent cursor-pointer" />
                      <input type="text" value={embed.header_text_color || ""} placeholder="#111827"
                        onChange={(e) => handleConfigChange({ header_text_color: e.target.value })}
                        className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none" />
                    </div>
                    <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                      Set to contrast with your website&apos;s background
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Proofs list */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-medium text-[var(--text-primary)]">Proofs</h2>
              {allProofs.length > 0 && (
                <button
                  onClick={async () => {
                    const token = await getToken();
                    if (!token) return;
                    const allSelected = allProofs.every((p) => embedProofIds.has(p.id));
                    if (allSelected) {
                      for (const proof of allProofs) {
                        if (embedProofIds.has(proof.id)) {
                          await removeProofFromEmbed(embedId, proof.id, token);
                        }
                      }
                      setEmbedProofIds(new Set());
                    } else {
                      for (const proof of allProofs) {
                        if (!embedProofIds.has(proof.id)) {
                          await addProofToEmbed(embedId, proof.id, embedProofIds.size, token);
                        }
                      }
                      setEmbedProofIds(new Set(allProofs.map((p) => p.id)));
                    }
                  }}
                  className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors"
                >
                  {allProofs.every((p) => embedProofIds.has(p.id)) ? "Unselect all" : "Select all"}
                </button>
              )}
            </div>
            {allProofs.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)]">
                No proofs available. Add proofs in the Proofs tab first.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {allProofs.map((proof) => (
                  <label
                    key={proof.id}
                    className="flex items-center gap-3 rounded-lg bg-[var(--bg-base)] p-2.5 cursor-pointer hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <input type="checkbox" checked={embedProofIds.has(proof.id)}
                      onChange={() => handleToggleProof(proof.id)}
                      className="rounded border-[var(--border)] flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-[var(--text-primary)]">{proof.author_name}</span>
                      {proof.content_text && (
                        <p className="text-xs text-[var(--text-tertiary)] truncate">{proof.content_text}</p>
                      )}
                    </div>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Embed code */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-[var(--text-primary)]">Embed Code</h2>
              <button onClick={handleCopyEmbed}
                className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors">
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="rounded-lg bg-[var(--bg-base)] border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap break-all">
{`<script type="text/javascript" src="https://shipproof.io/js/embed.js"></script>
<iframe id="shipproof-${embed.slug}" src="https://shipproof.io/embed/${embed.slug}" frameborder="0" scrolling="no" width="100%"></iframe>`}
            </pre>
          </div>
        </div>

        {/* Right panel — live preview */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden h-full">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-medium text-[var(--text-primary)]">Live Preview</h2>
            </div>
            {isStrip ? (
              <StripPreview embed={embed} proofs={selectedProofs} />
            ) : (
              <WallPreview embed={embed} product={product} proofs={selectedProofs} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Strip (inline_strip) Preview                                      */
/* ------------------------------------------------------------------ */

function StripProofCard({ proof, t, embed, stretch }: {
  proof: Proof;
  t: ReturnType<typeof getThemeColors>;
  embed: Embed;
  stretch?: boolean;
}) {
  const companyLogoUrl = getCompanyLogoUrl(proof.author_title);
  const cardWidth = embed.card_size || 300;
  const cardHeight = embed.card_height || 0;

  return (
    <div
      style={{
        width: `${cardWidth}px`,
        minWidth: `${cardWidth}px`,
        height: cardHeight > 0 ? `${cardHeight}px` : stretch ? "100%" : undefined,
        overflow: "hidden",
        padding: "20px",
        borderRadius: `${embed.border_radius}px`,
        border: `1px solid ${t.border}`,
        background: t.bgSurface,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {companyLogoUrl && <CompanyLogoImg url={companyLogoUrl} />}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        {embed.show_platform_icon && (
          <span
            className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-[12px] font-bold text-white flex-shrink-0 ${PLATFORM_COLORS[proof.source_platform] || "bg-gray-500"}`}
          >
            {PLATFORM_LABELS[proof.source_platform] || "O"}
          </span>
        )}
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: t.textPrimary }}>{proof.author_name}</div>
          {proof.author_title && (
            <div style={{ fontSize: "13px", color: t.textTertiary, marginTop: "3px" }}>{proof.author_title}</div>
          )}
        </div>
      </div>
      {proof.content_text && (
        <p style={{
          fontSize: `${embed.text_font_size}px`,
          lineHeight: "1.6",
          color: t.textSecondary,
          margin: 0,
          fontFamily: embed.text_font,
          fontWeight: embed.text_bold ? 700 : 400,
        }}>
          {proof.content_text}
        </p>
      )}
      {proof.content_image_url && (
        <img
          src={proof.content_image_url.replace(/^https?:\/\/https?:\/\//, "https://")}
          alt="Proof"
          style={{ marginTop: "8px", maxWidth: "100%", borderRadius: `${Math.max(embed.border_radius - 4, 0)}px` }}
        />
      )}
    </div>
  );
}

function StripPreview({ embed, proofs }: { embed: Embed; proofs: Proof[] }) {
  const t = getThemeColors((embed.theme || "dark") as DashboardTheme);
  const spacing = embed.card_spacing || 16;
  const rows = Math.max(1, Math.min(4, embed.rows || 1));
  const isMarquee = embed.auto_scroll;
  const widthPercent = Math.max(50, Math.min(100, embed.width_percent || 100));

  let containerBg = "transparent";
  if (embed.bg_color) {
    const hex = embed.bg_color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = (embed.bg_opacity ?? 100) / 100;
    containerBg = `rgba(${r},${g},${b},${a})`;
  }

  const rowProofs: Proof[][] = Array.from({ length: rows }, () => []);
  proofs.forEach((proof, i) => { rowProofs[i % rows].push(proof); });

  if (proofs.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-sm" style={{ color: t.textTertiary }}>
        No proofs selected. Toggle proofs on the left to see them here.
      </div>
    );
  }

  return (
    <div className="overflow-hidden" style={{ background: containerBg, padding: `${spacing}px`, maxHeight: "calc(100vh - 120px)", overflowY: "auto" }}>
      <style>{`
@keyframes sp-marquee-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
@keyframes sp-marquee-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
.sp-marquee-wrap { overflow: hidden; width: 100%; mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%); -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%); }
.sp-marquee-track { display: flex; width: max-content; }
.sp-marquee-track:hover { animation-play-state: paused; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: `${spacing}px`, width: `${widthPercent}%`, margin: "0 auto" }}>
        {rowProofs.map((rp, rowIdx) => {
          if (rp.length === 0) return null;

          if (isMarquee) {
            const minCards = Math.max(6, rp.length);
            const repeatCount = Math.ceil(minCards / rp.length);
            const filled: Proof[] = [];
            for (let i = 0; i < repeatCount; i++) filled.push(...rp);
            const duration = filled.length * 4.5;
            const direction = rowIdx % 2 === 0 ? "sp-marquee-left" : "sp-marquee-right";

            return (
              <div key={rowIdx} className="sp-marquee-wrap">
                <div className="sp-marquee-track"
                  style={{ gap: `${spacing}px`, animation: `${direction} ${duration}s linear infinite` }}>
                  {filled.map((proof, i) => (
                    <StripProofCard key={`a-${rowIdx}-${i}`} proof={proof} t={t} embed={embed} />
                  ))}
                  {filled.map((proof, i) => (
                    <StripProofCard key={`b-${rowIdx}-${i}`} proof={proof} t={t} embed={embed} />
                  ))}
                </div>
              </div>
            );
          }

          return (
            <div key={rowIdx} style={{ overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: "4px" }}>
              <div style={{ display: "flex", gap: `${spacing}px`, alignItems: "stretch" }}>
                {rp.map((proof) => (
                  <div key={proof.id} style={{ scrollSnapAlign: "start", display: "flex" }}>
                    <StripProofCard proof={proof} t={t} embed={embed} stretch />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {embed.show_branding && <BrandingFooter color={t.textTertiary} spacing={spacing} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Wall (wall_grid) Preview                                          */
/* ------------------------------------------------------------------ */

function WallProofCard({ proof, t, embed }: {
  proof: Proof;
  t: ReturnType<typeof getThemeColors>;
  embed: Embed;
}) {
  const radius = `${embed.border_radius}px`;
  const spacing = `${embed.card_spacing}px`;

  return (
    <div
      className="break-inside-avoid p-5 relative"
      style={{ marginBottom: spacing, borderRadius: radius, border: `1px solid ${t.border}`, background: t.bgSurface }}
    >
      {(() => {
        const logoUrl = getCompanyLogoUrl(proof.author_title);
        return logoUrl ? <CompanyLogoImg url={logoUrl} /> : null;
      })()}
      <div className="flex items-center gap-2 mb-3">
        {proof.author_avatar_url ? (
          <img src={proof.author_avatar_url} alt={proof.author_name}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
        ) : (
          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white flex-shrink-0 ${PLATFORM_COLORS[proof.source_platform] || "bg-gray-500"}`}>
            {proof.author_name.charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <div className="text-sm font-medium" style={{ color: t.textPrimary }}>{proof.author_name}</div>
          {proof.author_title && (
            <div className="text-xs" style={{ color: t.textTertiary }}>{proof.author_title}</div>
          )}
        </div>
      </div>
      {proof.content_text && (
        <p className="text-sm leading-relaxed" style={{ color: t.textSecondary }}>{proof.content_text}</p>
      )}
      {proof.content_image_url && (
        <img src={proof.content_image_url.replace(/^https?:\/\/https?:\/\//, "https://")} alt="Proof"
          className="mt-3 w-full"
          style={{ borderRadius: `${Math.max(embed.border_radius - 4, 0)}px`, border: `1px solid ${t.border}` }} />
      )}
      <div className="mt-3 text-xs" style={{ color: t.textTertiary }}>
        {new Date(proof.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );
}

function WallPreview({ embed, product, proofs }: { embed: Embed; product: Product; proofs: Proof[] }) {
  const t = getThemeColors((embed.theme || "dark") as DashboardTheme);
  const spacing = `${embed.card_spacing}px`;

  const bgStyle = embed.transparent_bg ? "transparent" : embed.bg_color || t.bgBase;
  const headerColor = (embed.transparent_bg && embed.header_text_color) ? embed.header_text_color : t.textPrimary;
  const headerSubColor = (embed.transparent_bg && embed.header_text_color) ? embed.header_text_color + "99" : t.textSecondary;

  return (
    <div className="overflow-y-auto" style={{ background: bgStyle, maxHeight: "calc(100vh - 120px)" }}>
      {embed.show_header && (
        <div className="max-w-5xl mx-auto px-4 py-10 text-center">
          <h1 className="text-2xl font-bold mb-2" style={{ color: headerColor }}>{embed.name}</h1>
          <p style={{ color: headerSubColor }}>
            {embed.subtitle || (
              <>
                What people are saying about{" "}
                <span className="font-medium" style={{ color: headerColor }}>{product.name}</span>
              </>
            )}
          </p>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 pb-10">
        {proofs.length === 0 ? (
          <div className="text-center py-12" style={{ color: t.textTertiary }}>
            No proofs selected. Toggle proofs on the left to see them here.
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3" style={{ columnGap: spacing }}>
            {proofs.map((proof) => (
              <WallProofCard key={proof.id} proof={proof} t={t} embed={embed} />
            ))}
          </div>
        )}
      </div>

      {embed.show_branding && <BrandingFooter color={t.textTertiary} spacing={0} center />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Shared branding footer                                            */
/* ------------------------------------------------------------------ */

function BrandingFooter({ color, spacing, center }: { color: string; spacing?: number; center?: boolean }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "4px",
      marginTop: spacing ? `${spacing}px` : undefined,
      paddingBottom: center ? "32px" : undefined,
      fontSize: "11px",
      color,
    }}>
      <span style={{ color: "#6366F1", display: "inline-flex", alignItems: "center", gap: "4px" }}>
        <svg width="16" height="16" viewBox="0 0 64 64">
          <circle cx="32" cy="32" r="28" fill="#6366F1"/>
          <path d="M32,46 C32,46 16,35 16,26 C16,20 19,17 24,17 C27,17 30,19 32,21 C34,19 37,17 40,17 C45,17 48,20 48,26 C48,35 32,46 32,46Z" fill="white"/>
        </svg>
        ShipProof
      </span>
    </div>
  );
}
