"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getSpace,
  getProduct,
  listProofs,
  listSpaceProofs,
  updateSpaceConfig,
  addProofToSpace,
  removeProofFromSpace,
  getCurrentUser,
  type Space,
  type Proof,
  type Product,
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

const SPACE_DEFAULTS: Partial<Space> = {
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
  layout: "carousel",
  rows: 1,
  width_percent: 100,
};

export default function SpaceEditPage() {
  const { id: productId, sid: spaceId } = useParams<{ id: string; sid: string }>();
  const { getToken } = useAuth();

  const [space, setSpace] = useState<Space | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [allProofs, setAllProofs] = useState<Proof[]>([]);
  const [spaceProofIds, setSpaceProofIds] = useState<Set<string>>(new Set());
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "business">("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [s, p, proofs, spList, user] = await Promise.all([
        getSpace(spaceId, token),
        getProduct(productId, token),
        listProofs(productId, token),
        listSpaceProofs(spaceId, token),
        getCurrentUser(token),
      ]);
      setSpace({ ...SPACE_DEFAULTS, ...s } as Space);
      setProduct(p);
      setAllProofs(proofs);
      setSpaceProofIds(new Set(spList.map((pr) => pr.id)));
      setUserPlan(user.plan);
    } catch {
      setError("Failed to load space data.");
    } finally {
      setLoading(false);
    }
  }, [getToken, productId, spaceId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfigChange = (updates: Partial<Space>) => {
    if (!space) return;
    const newSpace = { ...space, ...updates };
    setSpace(newSpace);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const token = await getToken();
      if (!token) return;
      try {
        await updateSpaceConfig(
          spaceId,
          {
            theme: newSpace.theme,
            show_platform_icon: newSpace.show_platform_icon,
            border_radius: newSpace.border_radius,
            card_spacing: newSpace.card_spacing,
            show_branding: newSpace.show_branding,
            visible_count: newSpace.visible_count,
            card_size: newSpace.card_size,
            card_height: newSpace.card_height,
            text_font_size: newSpace.text_font_size,
            text_font: newSpace.text_font,
            text_bold: newSpace.text_bold,
            bg_color: newSpace.bg_color,
            bg_opacity: newSpace.bg_opacity,
            layout: newSpace.layout || "carousel",
            rows: newSpace.rows || 1,
            width_percent: newSpace.width_percent || 100,
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
      if (spaceProofIds.has(proofId)) {
        await removeProofFromSpace(spaceId, proofId, token);
        setSpaceProofIds((prev) => {
          const next = new Set(prev);
          next.delete(proofId);
          return next;
        });
      } else {
        await addProofToSpace(spaceId, proofId, spaceProofIds.size, token);
        setSpaceProofIds((prev) => new Set(prev).add(proofId));
      }
    } catch {
      // ignore
    }
  };

  const handleCopyEmbed = () => {
    if (!space) return;
    const code = `<script type="text/javascript" src="https://shipproof.io/js/embed.js"></script>\n<iframe id="shipproof-${space.slug}" src="https://shipproof.io/embed/${space.slug}" frameborder="0" scrolling="no" width="100%"></iframe>`;
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

  if (error || !space || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          {error || "Space not found."}
        </div>
        <Link
          href={`/dashboard/products/${productId}?tab=spaces`}
          className="mt-4 inline-block text-sm text-[#6366F1] hover:text-[#818CF8]"
        >
          Back to product
        </Link>
      </div>
    );
  }

  const selectedProofs = allProofs.filter((p) => spaceProofIds.has(p.id));

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        href={`/dashboard/products/${productId}?tab=spaces`}
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to {product.name}
      </Link>

      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
        Edit Space: {space.name}
      </h1>

      <div className="flex gap-6" style={{ minHeight: "calc(100vh - 200px)" }}>
        {/* Left panel — edit controls */}
        <div className="w-1/4 min-w-[280px] flex-shrink-0 space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-5">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Configuration</h2>

            {/* Layout */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-2">Layout</label>
              <div className="flex gap-2">
                {([
                  { value: "carousel", label: "Carousel", desc: "Manual scroll" },
                  { value: "marquee", label: "Marquee", desc: "Auto-scrolling" },
                ] as const).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleConfigChange({ layout: opt.value })}
                    className={`flex-1 rounded-lg border px-2 py-2 text-left transition-all cursor-pointer ${
                      (space.layout || "carousel") === opt.value
                        ? "border-[#6366F1] bg-[#6366F1]/10"
                        : "border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    <span className={`block text-xs font-medium ${
                      (space.layout || "carousel") === opt.value ? "text-[#818CF8]" : "text-[var(--text-primary)]"
                    }`}>
                      {opt.label}
                    </span>
                    <span className="block text-[9px] text-[var(--text-tertiary)] mt-0.5">
                      {opt.desc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rows */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-2">
                Rows: {space.rows || 1}
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleConfigChange({ rows: n })}
                    className={`flex-1 rounded-lg border px-2 py-2 text-center transition-all cursor-pointer text-xs font-medium ${
                      (space.rows || 1) === n
                        ? "border-[#6366F1] bg-[#6366F1]/10 text-[#818CF8]"
                        : "border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)] text-[var(--text-primary)]"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Width */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                Width: {space.width_percent || 100}%
              </label>
              <input
                type="range"
                min={50}
                max={100}
                value={space.width_percent || 100}
                onChange={(e) => handleConfigChange({ width_percent: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Theme */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Theme</label>
              <select
                value={space.theme}
                onChange={(e) => handleConfigChange({ theme: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
              >
                <option value="dark">Dark</option>
                <option value="dim">Dim</option>
                <option value="gray">Gray</option>
                <option value="light">Light</option>
              </select>
            </div>

            {/* Card Width */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                Card Width: {space.card_size}px
              </label>
              <input
                type="range"
                min={200}
                max={420}
                value={space.card_size}
                onChange={(e) => handleConfigChange({ card_size: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Card Height */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                Card Height: {space.card_height === 0 ? "Auto" : `${space.card_height}px`}
              </label>
              <input
                type="range"
                min={0}
                max={500}
                step={10}
                value={space.card_height}
                onChange={(e) => handleConfigChange({ card_height: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Border Radius */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                Border Radius: {space.border_radius}px
              </label>
              <input
                type="range"
                min={0}
                max={24}
                value={space.border_radius}
                onChange={(e) => handleConfigChange({ border_radius: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Card Spacing */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                Card Spacing: {space.card_spacing}px
              </label>
              <input
                type="range"
                min={4}
                max={32}
                value={space.card_spacing}
                onChange={(e) => handleConfigChange({ card_spacing: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Text Font Size */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                Text Size: {space.text_font_size}px
              </label>
              <input
                type="range"
                min={10}
                max={20}
                value={space.text_font_size}
                onChange={(e) => handleConfigChange({ text_font_size: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Text Font */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Font</label>
              <select
                value={space.text_font}
                onChange={(e) => handleConfigChange({ text_font: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
              >
                <option value="Inter">Inter</option>
                <option value="System UI">System UI</option>
                <option value="Georgia">Georgia</option>
                <option value="Merriweather">Merriweather</option>
                <option value="JetBrains Mono">JetBrains Mono</option>
              </select>
            </div>

            {/* Text Bold */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={space.text_bold}
                onChange={(e) => handleConfigChange({ text_bold: e.target.checked })}
                className="rounded border-[var(--border)]"
              />
              <span className="text-xs text-[var(--text-secondary)]">Bold text</span>
            </label>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={space.show_platform_icon}
                  onChange={(e) => handleConfigChange({ show_platform_icon: e.target.checked })}
                  className="rounded border-[var(--border)]"
                />
                Show platform icons
              </label>

              <div>
                <label
                  className={`flex items-center gap-2 text-sm ${
                    userPlan === "business" ? "text-[var(--text-primary)] cursor-pointer" : "text-[var(--text-tertiary)] cursor-not-allowed"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!space.show_branding}
                    disabled={userPlan !== "business"}
                    onChange={(e) => handleConfigChange({ show_branding: !e.target.checked })}
                    className="rounded border-[var(--border)]"
                  />
                  Remove &quot;Powered by ShipProof&quot;
                </label>
                {userPlan !== "business" && (
                  <p className="text-[10px] text-[var(--text-tertiary)] ml-6 mt-0.5">
                    Business plan only
                  </p>
                )}
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                Background Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={space.bg_color || "#0F0F10"}
                  onChange={(e) => handleConfigChange({ bg_color: e.target.value })}
                  className="h-8 w-8 rounded border border-[var(--border)] bg-transparent cursor-pointer"
                />
                <input
                  type="text"
                  value={space.bg_color || ""}
                  placeholder="Default (transparent)"
                  onChange={(e) => handleConfigChange({ bg_color: e.target.value })}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
                />
              </div>
            </div>

            {/* Background Opacity */}
            {space.bg_color && (
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  Background Opacity: {space.bg_opacity}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={space.bg_opacity}
                  onChange={(e) => handleConfigChange({ bg_opacity: Number(e.target.value) })}
                  className="w-full"
                />
              </div>
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
                    const allSelected = allProofs.every((p) => spaceProofIds.has(p.id));
                    if (allSelected) {
                      for (const proof of allProofs) {
                        if (spaceProofIds.has(proof.id)) {
                          await removeProofFromSpace(spaceId, proof.id, token);
                        }
                      }
                      setSpaceProofIds(new Set());
                    } else {
                      for (const proof of allProofs) {
                        if (!spaceProofIds.has(proof.id)) {
                          await addProofToSpace(spaceId, proof.id, spaceProofIds.size, token);
                        }
                      }
                      setSpaceProofIds(new Set(allProofs.map((p) => p.id)));
                    }
                  }}
                  className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors"
                >
                  {allProofs.every((p) => spaceProofIds.has(p.id)) ? "Unselect all" : "Select all"}
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
                    <input
                      type="checkbox"
                      checked={spaceProofIds.has(proof.id)}
                      onChange={() => handleToggleProof(proof.id)}
                      className="rounded border-[var(--border)] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-[var(--text-primary)]">
                        {proof.author_name}
                      </span>
                      {proof.content_text && (
                        <p className="text-xs text-[var(--text-tertiary)] truncate">
                          {proof.content_text}
                        </p>
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
              <button
                onClick={handleCopyEmbed}
                className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <pre className="rounded-lg bg-[var(--bg-base)] border border-[var(--border)] p-3 text-xs text-[var(--text-secondary)] overflow-x-auto whitespace-pre-wrap break-all">
{`<script type="text/javascript" src="https://shipproof.io/js/embed.js"></script>
<iframe id="shipproof-${space.slug}" src="https://shipproof.io/embed/${space.slug}" frameborder="0" scrolling="no" width="100%"></iframe>`}
            </pre>
          </div>
        </div>

        {/* Right panel — live preview */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden h-full">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-medium text-[var(--text-primary)]">Live Preview</h2>
            </div>
            <SpacePreview
              space={space}
              proofs={selectedProofs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function SpaceProofCard({ proof, t, space, stretch }: {
  proof: Proof;
  t: ReturnType<typeof getThemeColors>;
  space: Space;
  stretch?: boolean;
}) {
  const companyLogoUrl = getCompanyLogoUrl(proof.author_title);
  const radius = `${space.border_radius}px`;
  const cardWidth = space.card_size || 300;
  const cardHeight = space.card_height || 0;
  const textFontSize = space.text_font_size || 14;
  const textFont = space.text_font || "Inter";
  const textBold = space.text_bold || false;

  return (
    <div
      style={{
        width: `${cardWidth}px`,
        minWidth: `${cardWidth}px`,
        height: cardHeight > 0 ? `${cardHeight}px` : stretch ? "100%" : undefined,
        overflow: "hidden",
        padding: "20px",
        borderRadius: radius,
        border: `1px solid ${t.border}`,
        background: t.bgSurface,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {companyLogoUrl && <CompanyLogoImg url={companyLogoUrl} />}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        {space.show_platform_icon && (
          <span
            className={`inline-flex items-center justify-center w-9 h-9 rounded-full text-[12px] font-bold text-white flex-shrink-0 ${PLATFORM_COLORS[proof.source_platform] || "bg-gray-500"}`}
          >
            {PLATFORM_LABELS[proof.source_platform] || "O"}
          </span>
        )}
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: t.textPrimary }}>
            {proof.author_name}
          </div>
          {proof.author_title && (
            <div style={{ fontSize: "13px", color: t.textTertiary, marginTop: "3px" }}>
              {proof.author_title}
            </div>
          )}
        </div>
      </div>
      {proof.content_text && (
        <p style={{
          fontSize: `${textFontSize}px`,
          lineHeight: "1.6",
          color: t.textSecondary,
          margin: 0,
          fontFamily: textFont,
          fontWeight: textBold ? 700 : 400,
        }}>
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
            borderRadius: `${Math.max(space.border_radius - 4, 0)}px`,
          }}
        />
      )}
    </div>
  );
}

function SpacePreview({ space, proofs }: { space: Space; proofs: Proof[] }) {
  const t = getThemeColors((space.theme || "dark") as DashboardTheme);
  const spacing = space.card_spacing || 16;
  const rows = Math.max(1, Math.min(4, space.rows || 1));
  const layout = space.layout || "carousel";
  const widthPercent = Math.max(50, Math.min(100, space.width_percent || 100));

  // Compute background
  let containerBg = "transparent";
  if (space.bg_color) {
    const hex = space.bg_color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const a = (space.bg_opacity ?? 100) / 100;
    containerBg = `rgba(${r},${g},${b},${a})`;
  }

  // Split proofs across rows
  const rowProofs: Proof[][] = Array.from({ length: rows }, () => []);
  proofs.forEach((proof, i) => {
    rowProofs[i % rows].push(proof);
  });

  if (proofs.length === 0) {
    return (
      <div className="flex items-center justify-center py-20 text-sm" style={{ color: t.textTertiary }}>
        No proofs selected. Toggle proofs on the left to see them here.
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden"
      style={{
        background: containerBg,
        padding: `${spacing}px`,
        maxHeight: "calc(100vh - 120px)",
        overflowY: "auto",
      }}
    >
      <style>{`
@keyframes sp-marquee-left { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
@keyframes sp-marquee-right { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
.sp-marquee-wrap { overflow: hidden; width: 100%; mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%); -webkit-mask-image: linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%); }
.sp-marquee-track { display: flex; width: max-content; }
.sp-marquee-track:hover { animation-play-state: paused; }
@media (prefers-reduced-motion: reduce) { .sp-marquee-track { animation: none; } .sp-marquee-wrap { overflow-x: auto; mask-image: none; -webkit-mask-image: none; } }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", gap: `${spacing}px`, width: `${widthPercent}%`, margin: "0 auto" }}>
        {rowProofs.map((rp, rowIdx) => {
          if (rp.length === 0) return null;

          if (layout === "marquee") {
            // Fill cards for seamless loop
            const minCards = Math.max(6, rp.length);
            const repeatCount = Math.ceil(minCards / rp.length);
            const filled: Proof[] = [];
            for (let i = 0; i < repeatCount; i++) filled.push(...rp);
            const duration = filled.length * 4.5;
            const direction = rowIdx % 2 === 0 ? "sp-marquee-left" : "sp-marquee-right";

            return (
              <div key={rowIdx} className="sp-marquee-wrap">
                <div
                  className="sp-marquee-track"
                  style={{
                    gap: `${spacing}px`,
                    animation: `${direction} ${duration}s linear infinite`,
                  }}
                >
                  {filled.map((proof, i) => (
                    <SpaceProofCard key={`a-${rowIdx}-${i}`} proof={proof} t={t} space={space} />
                  ))}
                  {filled.map((proof, i) => (
                    <SpaceProofCard key={`b-${rowIdx}-${i}`} proof={proof} t={t} space={space} />
                  ))}
                </div>
              </div>
            );
          }

          // Carousel
          return (
            <div key={rowIdx} style={{ overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: "4px" }}>
              <div style={{ display: "flex", gap: `${spacing}px`, alignItems: "stretch" }}>
                {rp.map((proof) => (
                  <div key={proof.id} style={{ scrollSnapAlign: "start", display: "flex" }}>
                    <SpaceProofCard proof={proof} t={t} space={space} stretch />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Branding */}
      {space.show_branding && (
        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
          marginTop: `${spacing}px`,
          fontSize: "11px",
          color: t.textTertiary,
        }}>
          <span style={{ color: "#6366F1", display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <svg width="16" height="16" viewBox="0 0 64 64">
              <rect x="4" y="4" width="56" height="56" rx="14" fill="#6366F1"/>
              <rect x="14" y="11" width="36" height="26" rx="7" fill="white"/>
              <path d="M22,37 L18,48 L30,37Z" fill="white"/>
              <path d="M22,22 L28,30 L42,15" fill="none" stroke="#6366F1" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            ShipProof
          </span>
        </div>
      )}
    </div>
  );
}
