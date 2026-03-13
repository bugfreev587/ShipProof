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
      <div className="flex items-center justify-center min-h-[60vh] text-[#9CA3AF]">
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
          href={`/dashboard/products/${productId}`}
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
        href={`/dashboard/products/${productId}`}
        className="inline-flex items-center gap-1 text-sm text-[#9CA3AF] hover:text-[#F1F1F3] transition-colors mb-4"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to {product.name}
      </Link>

      <h1 className="text-xl font-semibold text-[#F1F1F3] mb-6">
        Edit Wall: {wall.name}
      </h1>

      <div className="flex gap-6" style={{ minHeight: "calc(100vh - 200px)" }}>
        {/* Left panel — edit controls */}
        <div className="w-1/4 min-w-[280px] flex-shrink-0 space-y-6">
          <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-5 space-y-5">
            <h2 className="text-sm font-medium text-[#F1F1F3]">Configuration</h2>

            {/* Theme */}
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1">Theme</label>
              <select
                value={wall.theme}
                onChange={(e) => handleConfigChange({ theme: e.target.value })}
                className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none"
              >
                <option value="dark">Dark</option>
                <option value="light">Light</option>
              </select>
            </div>

            {/* Border Radius */}
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1">
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
              <label className="block text-xs text-[#9CA3AF] mb-1">
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
              <label className="flex items-center gap-2 text-sm text-[#F1F1F3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={wall.show_platform_icon}
                  onChange={(e) => handleConfigChange({ show_platform_icon: e.target.checked })}
                  className="rounded border-[#2A2A30]"
                />
                Show platform icons
              </label>

              <div>
                <label
                  className={`flex items-center gap-2 text-sm ${
                    userPlan === "business" ? "text-[#F1F1F3] cursor-pointer" : "text-[#6B7280] cursor-not-allowed"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!wall.show_branding}
                    disabled={userPlan !== "business"}
                    onChange={(e) => handleConfigChange({ show_branding: !e.target.checked })}
                    className="rounded border-[#2A2A30]"
                  />
                  Remove &quot;Powered by ShipProof&quot;
                </label>
                {userPlan !== "business" && (
                  <p className="text-[10px] text-[#6B7280] ml-6 mt-0.5">
                    Business plan only
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Proofs list */}
          <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-5 space-y-3">
            <h2 className="text-sm font-medium text-[#F1F1F3]">Proofs</h2>
            {allProofs.length === 0 ? (
              <p className="text-xs text-[#6B7280]">
                No proofs available. Add proofs in the Proofs tab first.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-[400px] overflow-y-auto">
                {allProofs.map((proof) => (
                  <label
                    key={proof.id}
                    className="flex items-center gap-3 rounded-lg bg-[#0F0F10] p-2.5 cursor-pointer hover:bg-[#242429] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={wallProofIds.has(proof.id)}
                      onChange={() => handleToggleProof(proof.id)}
                      className="rounded border-[#2A2A30] flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-[#F1F1F3]">
                        {proof.author_name}
                      </span>
                      {proof.content_text && (
                        <p className="text-xs text-[#6B7280] truncate">
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
          <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] overflow-hidden h-full">
            <div className="px-5 py-3 border-b border-[#2A2A30]">
              <h2 className="text-sm font-medium text-[#F1F1F3]">Live Preview</h2>
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
  const isDark = wall.theme === "dark";
  const bgBase = isDark ? "#0F0F10" : "#F9FAFB";
  const bgCard = isDark ? "#1A1A1F" : "#FFFFFF";
  const borderColor = isDark ? "#2A2A30" : "#E5E7EB";
  const textPrimary = isDark ? "#F1F1F3" : "#111827";
  const textSecondary = isDark ? "#9CA3AF" : "#6B7280";
  const textTertiary = isDark ? "#6B7280" : "#9CA3AF";
  const radius = `${wall.border_radius}px`;
  const spacing = `${wall.card_spacing}px`;

  return (
    <div className="overflow-y-auto" style={{ background: bgBase, maxHeight: "calc(100vh - 260px)" }}>
      {/* Header */}
      <div className="max-w-5xl mx-auto px-4 py-10 text-center">
        <h1 className="text-2xl font-bold mb-2" style={{ color: textPrimary }}>
          {wall.name}
        </h1>
        <p style={{ color: textSecondary }}>
          What people are saying about{" "}
          <span className="font-medium" style={{ color: textPrimary }}>
            {product.name}
          </span>
        </p>
      </div>

      {/* Masonry Grid */}
      <div className="max-w-5xl mx-auto px-4 pb-10">
        {proofs.length === 0 ? (
          <div className="text-center py-12" style={{ color: textTertiary }}>
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
                  border: `1px solid ${borderColor}`,
                  background: bgCard,
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
                    <div className="text-sm font-medium" style={{ color: textPrimary }}>
                      {proof.author_name}
                    </div>
                    {proof.author_title && (
                      <div className="text-xs" style={{ color: textTertiary }}>
                        {proof.author_title}
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                {proof.content_text && (
                  <p className="text-sm leading-relaxed" style={{ color: textSecondary }}>
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
                      border: `1px solid ${borderColor}`,
                    }}
                  />
                )}

                {/* Date */}
                <div className="mt-3 text-xs" style={{ color: textTertiary }}>
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
        <div className="text-center pb-8 text-xs" style={{ color: textTertiary }}>
          Powered by{" "}
          <span style={{ color: "#6366F1" }}>ShipProof</span>
        </div>
      )}
    </div>
  );
}
