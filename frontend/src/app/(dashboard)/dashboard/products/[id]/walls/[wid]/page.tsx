"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getWall,
  getProduct,
  listProofs,
  listWallProofs,
  updateWallConfig,
  addProofToWall,
  removeProofFromWall,
  getCurrentUser,
  type Wall,
  type Proof,
  type Product,
} from "@/lib/api";
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

function getThemeColors(theme: string) {
  switch (theme) {
    case "dim":
      return {
        bgBase: "#15202B", bgCard: "#1E2D3D", borderColor: "#2B3D4F",
        textPrimary: "var(--text-primary)", textSecondary: "var(--text-secondary)", textTertiary: "var(--text-tertiary)",
      };
    case "gray":
      return {
        bgBase: "var(--border)", bgCard: "#343440", borderColor: "#45454F",
        textPrimary: "var(--text-primary)", textSecondary: "#B0B0B8", textTertiary: "#8A8A94",
      };
    case "light":
      return {
        bgBase: "#F9FAFB", bgCard: "#FFFFFF", borderColor: "#E5E7EB",
        textPrimary: "#111827", textSecondary: "var(--text-tertiary)", textTertiary: "var(--text-secondary)",
      };
    default: // dark
      return {
        bgBase: "var(--bg-base)", bgCard: "var(--bg-surface)", borderColor: "var(--border)",
        textPrimary: "var(--text-primary)", textSecondary: "var(--text-secondary)", textTertiary: "var(--text-tertiary)",
      };
  }
}

export default function WallEditPage() {
  const { id: productId, wid: wallId } = useParams<{ id: string; wid: string }>();
  const { getToken } = useAuth();

  const [wall, setWall] = useState<Wall | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [allProofs, setAllProofs] = useState<Proof[]>([]);
  const [wallProofIds, setWallProofIds] = useState<Set<string>>(new Set());
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "business">("free");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [w, p, proofs, wpList, user] = await Promise.all([
        getWall(wallId, token),
        getProduct(productId, token),
        listProofs(productId, token),
        listWallProofs(wallId, token),
        getCurrentUser(token),
      ]);
      setWall(w);
      setProduct(p);
      setAllProofs(proofs);
      setWallProofIds(new Set(wpList.map((pr) => pr.id)));
      setUserPlan(user.plan);
    } catch {
      setError("Failed to load wall data.");
    } finally {
      setLoading(false);
    }
  }, [getToken, productId, wallId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleConfigChange = (updates: Partial<Wall>) => {
    if (!wall) return;
    const newWall = { ...wall, ...updates };
    setWall(newWall);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const token = await getToken();
      if (!token) return;
      try {
        await updateWallConfig(
          wallId,
          {
            theme: newWall.theme,
            border_radius: newWall.border_radius,
            card_spacing: newWall.card_spacing,
            show_platform_icon: newWall.show_platform_icon,
            show_branding: newWall.show_branding,
            bg_color: newWall.bg_color,
            transparent_bg: newWall.transparent_bg,
            header_text_color: newWall.header_text_color,
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
      if (wallProofIds.has(proofId)) {
        await removeProofFromWall(wallId, proofId, token);
        setWallProofIds((prev) => {
          const next = new Set(prev);
          next.delete(proofId);
          return next;
        });
      } else {
        await addProofToWall(wallId, proofId, wallProofIds.size, token);
        setWallProofIds((prev) => new Set(prev).add(proofId));
      }
    } catch {
      // ignore
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-secondary)]">
        Loading...
      </div>
    );
  }

  if (error || !wall || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          {error || "Wall not found."}
        </div>
        <Link
          href={`/dashboard/products/${productId}?tab=walls`}
          className="mt-4 inline-block text-sm text-[#6366F1] hover:text-[#818CF8]"
        >
          Back to product
        </Link>
      </div>
    );
  }

  const selectedProofs = allProofs.filter((p) => wallProofIds.has(p.id));

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      {/* Back link */}
      <Link
        href={`/dashboard/products/${productId}?tab=walls`}
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to {product.name}
      </Link>

      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
        Edit Wall: {wall.name}
      </h1>

      <div className="flex gap-6" style={{ minHeight: "calc(100vh - 200px)" }}>
        {/* Left panel — edit controls */}
        <div className="w-1/4 min-w-[280px] flex-shrink-0 space-y-6">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-5">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Configuration</h2>

            {/* Theme */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Theme</label>
              <select
                value={wall.theme}
                onChange={(e) => handleConfigChange({ theme: e.target.value })}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
              >
                <option value="dark">Dark</option>
                <option value="dim">Dim</option>
                <option value="gray">Gray</option>
                <option value="light">Light</option>
              </select>
            </div>

            {/* Border Radius */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                Border Radius: {wall.border_radius}px
              </label>
              <input
                type="range"
                min={0}
                max={24}
                value={wall.border_radius}
                onChange={(e) => handleConfigChange({ border_radius: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Card Spacing */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                Card Spacing: {wall.card_spacing}px
              </label>
              <input
                type="range"
                min={4}
                max={32}
                value={wall.card_spacing}
                onChange={(e) => handleConfigChange({ card_spacing: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={wall.show_platform_icon}
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
                    checked={!wall.show_branding}
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

              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={wall.transparent_bg}
                  onChange={(e) => handleConfigChange({ transparent_bg: e.target.checked, bg_color: "" })}
                  className="rounded border-[var(--border)]"
                />
                Transparent background (embed only)
              </label>
            </div>

            {/* Background Color — embed only */}
            {!wall.transparent_bg && (
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  Background Color (embed only)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={wall.bg_color || "#0F0F10"}
                    onChange={(e) => handleConfigChange({ bg_color: e.target.value })}
                    className="h-8 w-8 rounded border border-[var(--border)] bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={wall.bg_color || ""}
                    placeholder="Default (theme)"
                    onChange={(e) => handleConfigChange({ bg_color: e.target.value })}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Header Text Color */}
            {wall.transparent_bg && (
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  Header Text Color (embed only)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={wall.header_text_color || "#111827"}
                    onChange={(e) => handleConfigChange({ header_text_color: e.target.value })}
                    className="h-8 w-8 rounded border border-[var(--border)] bg-transparent cursor-pointer"
                  />
                  <input
                    type="text"
                    value={wall.header_text_color || ""}
                    placeholder="#111827"
                    onChange={(e) => handleConfigChange({ header_text_color: e.target.value })}
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
                  />
                </div>
                <p className="text-[10px] text-[var(--text-tertiary)] mt-1">
                  Set to contrast with your website&apos;s background
                </p>
              </div>
            )}
          </div>

          {/* Proofs list */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-3">
            <h2 className="text-sm font-medium text-[var(--text-primary)]">Proofs</h2>
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
                      checked={wallProofIds.has(proof.id)}
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
        </div>

        {/* Right panel — live preview */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden h-full">
            <div className="px-5 py-3 border-b border-[var(--border)]">
              <h2 className="text-sm font-medium text-[var(--text-primary)]">Live Preview</h2>
            </div>
            <WallPreview
              wall={wall}
              product={product}
              proofs={selectedProofs}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function WallPreview({
  wall,
  product,
  proofs,
}: {
  wall: Wall;
  product: Product;
  proofs: Proof[];
}) {
  const t = getThemeColors(wall.theme);
  const radius = `${wall.border_radius}px`;
  const spacing = `${wall.card_spacing}px`;

  const bgStyle = wall.transparent_bg
    ? "transparent"
    : wall.bg_color || t.bgBase;
  const headerColor = (wall.transparent_bg && wall.header_text_color) ? wall.header_text_color : t.textPrimary;
  const headerSubColor = (wall.transparent_bg && wall.header_text_color) ? wall.header_text_color + "99" : t.textSecondary;

  return (
    <div className="overflow-y-auto" style={{ background: bgStyle, maxHeight: "calc(100vh - 260px)" }}>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold mb-2" style={{ color: headerColor }}>
          {wall.name}
        </h1>
        <p style={{ color: headerSubColor }}>
          What people are saying about{" "}
          <span className="font-medium" style={{ color: headerColor }}>
            {product.name}
          </span>
        </p>
      </div>

      {/* Masonry Grid */}
      <div className="max-w-5xl mx-auto px-4 pb-10">
        {proofs.length === 0 ? (
          <div className="text-center py-12" style={{ color: t.textTertiary }}>
            No proofs selected. Toggle proofs on the left to see them here.
          </div>
        ) : (
          <div
            className="columns-1 sm:columns-2 lg:columns-3"
            style={{ columnGap: spacing }}
          >
            {proofs.map((proof) => (
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
                {(() => {
                  const logoUrl = getCompanyLogoUrl(proof.author_title);
                  return logoUrl ? <CompanyLogoImg url={logoUrl} /> : null;
                })()}
                {/* Author */}
                <div className="flex items-center gap-2 mb-3">
                  {proof.author_avatar_url ? (
                    <img
                      src={proof.author_avatar_url}
                      alt={proof.author_name}
                      className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    />
                  ) : (
                    <span
                      className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold text-white flex-shrink-0 ${PLATFORM_COLORS[proof.source_platform] || "bg-gray-500"}`}
                    >
                      {proof.author_name.charAt(0).toUpperCase()}
                    </span>
                  )}
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
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {wall.show_branding && (
        <div className="text-center pb-8 text-xs" style={{ color: t.textTertiary }}>
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
