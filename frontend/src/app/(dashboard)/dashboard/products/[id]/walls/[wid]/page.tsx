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
            </div>
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

  return (
    <div className="overflow-y-auto" style={{ background: t.bgBase, maxHeight: "calc(100vh - 260px)" }}>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold mb-2" style={{ color: t.textPrimary }}>
          {wall.name}
        </h1>
        <p style={{ color: t.textSecondary }}>
          What people are saying about{" "}
          <span className="font-medium" style={{ color: t.textPrimary }}>
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
                className="break-inside-avoid p-5"
                style={{
                  marginBottom: spacing,
                  borderRadius: radius,
                  border: `1px solid ${t.borderColor}`,
                  background: t.bgCard,
                }}
              >
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
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {wall.show_branding && (
        <div className="text-center pb-8 text-xs" style={{ color: t.textTertiary }}>
          Powered by{" "}
          <span style={{ color: "#6366F1" }}>ShipProof</span>
        </div>
      )}
    </div>
  );
}
