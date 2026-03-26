"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  listSpaces,
  createSpace,
  deleteSpace,
  listSpaceProofs,
  listWalls,
  createWall,
  deleteWall,
  listWallProofs,
  updateWallConfig,
  getCurrentUser,
  type Space,
  type Wall,
  type Product,
  type Proof,
  ApiError,
} from "@/lib/api";
import type { WallProof, WallDisplayConfig } from "@/components/wall-of-proof/types";
import WallEditorPreview from "@/components/wall-of-proof/wall-editor-preview";

interface Props {
  product: Product;
  onPlanLimit?: (message: string) => void;
  activeSection?: "spaces" | "walls";
}

export default function WidgetWallTab({ product, onPlanLimit, activeSection = "spaces" }: Props) {
  const { getToken } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [wallProofCounts, setWallProofCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "business">("free");

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [s, w, user] = await Promise.all([
        listSpaces(product.id, token),
        listWalls(product.id, token),
        getCurrentUser(token),
      ]);
      setSpaces(s);
      setWalls(w);
      setUserPlan(user.plan);

      // Fetch proof counts for each wall
      const counts: Record<string, number> = {};
      await Promise.all(
        w.map(async (wall) => {
          try {
            const proofs = await listWallProofs(wall.id, token);
            counts[wall.id] = proofs.length;
          } catch {
            counts[wall.id] = 0;
          }
        }),
      );
      setWallProofCounts(counts);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken, product.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return <div className="text-[var(--text-secondary)]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {activeSection === "spaces" ? (
        <SpacesSection
          product={product}
          spaces={spaces}
          userPlan={userPlan}
          onUpdated={fetchData}
          setError={setError}
          onPlanLimit={onPlanLimit}
        />
      ) : (
        <WallsSection
          product={product}
          walls={walls}
          wallProofCounts={wallProofCounts}
          onUpdated={fetchData}
          setError={setError}
          onPlanLimit={onPlanLimit}
        />
      )}
    </div>
  );
}

/* ─── Spaces Section ─── */

function SpacesSection({
  product,
  spaces,
  userPlan,
  onUpdated,
  setError,
  onPlanLimit,
}: {
  product: Product;
  spaces: Space[];
  userPlan: "free" | "pro" | "business";
  onUpdated: () => void;
  setError: (e: string) => void;
  onPlanLimit?: (message: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Spaces</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Curate collections of proofs with their own embed code and styling.
          </p>
        </div>
        <CreateSpaceButton
          product={product}
          onCreated={onUpdated}
          setError={setError}
          onPlanLimit={onPlanLimit}
        />
      </div>

      {spaces.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center text-[var(--text-secondary)]">
          No spaces yet. Create your first Space to embed curated proofs!
        </div>
      ) : (
        <div className="space-y-4">
          {spaces.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              product={product}
              userPlan={userPlan}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateSpaceButton({
  product,
  onCreated,
  setError,
  onPlanLimit,
}: {
  product: Product;
  onCreated: () => void;
  setError: (e: string) => void;
  onPlanLimit?: (message: string) => void;
}) {
  const { getToken } = useAuth();
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      await createSpace(product.id, name, token);
      setName("");
      setShowInput(false);
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402 && onPlanLimit) {
        onPlanLimit(err.message);
      } else if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors"
      >
        + Create Space
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        placeholder="Space name..."
        autoFocus
        className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
      />
      <button
        onClick={handleCreate}
        disabled={saving}
        className="rounded-lg bg-[#6366F1] px-3 py-2 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
      >
        {saving ? "..." : "Create"}
      </button>
      <button
        onClick={() => setShowInput(false)}
        className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

function SpaceCard({
  space,
  product,
  onUpdated,
}: {
  space: Space;
  product: Product;
  userPlan: "free" | "pro" | "business";
  onUpdated: () => void;
}) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [proofCount, setProofCount] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const proofs = await listSpaceProofs(space.id, token);
        setProofCount(proofs.length);
      } catch {
        // ignore
      }
    })();
  }, [space.id, getToken]);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const token = await getToken();
    if (!token) return;
    await deleteSpace(space.id, token);
    onUpdated();
  };

  return (
    <div
      onClick={() => router.push(`/dashboard/products/${product.id}/spaces/${space.id}`)}
      className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 cursor-pointer hover:border-[var(--color-border-hover)] transition-all duration-200 hover:shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
    >
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-[var(--text-primary)]">{space.name}</h4>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="text-xs text-[var(--text-tertiary)]">
              {proofCount} proof{proofCount !== 1 ? "s" : ""}
            </span>
            <span className="text-xs text-[var(--text-tertiary)]">
              {space.layout || "carousel"}
            </span>
            {(space.rows || 1) > 1 && (
              <span className="text-xs text-[var(--text-tertiary)]">
                {space.rows} rows
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              router.push(`/dashboard/products/${product.id}/spaces/${space.id}`);
            }}
            className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:opacity-80 transition-all"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg bg-[#ef4444] px-3 py-1.5 text-xs font-medium text-white hover:opacity-85 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Walls Section ─── */

function WallsSection({
  product,
  walls,
  wallProofCounts,
  onUpdated,
  setError,
  onPlanLimit,
}: {
  product: Product;
  walls: Wall[];
  wallProofCounts: Record<string, number>;
  onUpdated: () => void;
  setError: (e: string) => void;
  onPlanLimit?: (message: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Wall of Love</h3>
        <CreateWallButton
          product={product}
          onCreated={onUpdated}
          setError={setError}
          onPlanLimit={onPlanLimit}
        />
      </div>

      {walls.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center text-[var(--text-secondary)]">
          No walls yet. Create your first Wall of Love!
        </div>
      ) : (
        <div className="space-y-3">
          {walls.map((wall) => (
            <WallCard
              key={wall.id}
              wall={wall}
              product={product}
              proofCount={wallProofCounts[wall.id] ?? 0}
              onUpdated={onUpdated}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CreateWallButton({
  product,
  onCreated,
  setError,
  onPlanLimit,
}: {
  product: Product;
  onCreated: () => void;
  setError: (e: string) => void;
  onPlanLimit?: (message: string) => void;
}) {
  const { getToken } = useAuth();
  const [showInput, setShowInput] = useState(false);
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      await createWall(product.id, name, token);
      setName("");
      setShowInput(false);
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402 && onPlanLimit) {
        onPlanLimit(err.message);
      } else if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  if (!showInput) {
    return (
      <button
        onClick={() => setShowInput(true)}
        className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors"
      >
        + Create Wall
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleCreate()}
        placeholder="Wall name..."
        autoFocus
        className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
      />
      <button
        onClick={handleCreate}
        disabled={saving}
        className="rounded-lg bg-[#6366F1] px-3 py-2 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
      >
        {saving ? "..." : "Create"}
      </button>
      <button
        onClick={() => setShowInput(false)}
        className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

function proofToWallProof(proof: Proof): WallProof {
  return {
    id: proof.id,
    author_name: proof.author_name,
    author_title: proof.author_title,
    author_avatar_url: proof.author_avatar_url,
    content_text: proof.content_text,
    content_image_url: proof.content_image_url,
    source_platform: proof.source_platform,
    source_url: proof.source_url,
    is_verified: false,
    created_at: proof.created_at,
    tags: proof.tags,
  };
}

function WallCard({
  wall,
  product,
  proofCount,
  onUpdated,
}: {
  wall: Wall;
  product: Product;
  proofCount: number;
  onUpdated: () => void;
}) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [showPreview, setShowPreview] = useState(false);
  const [wallProofs, setWallProofs] = useState<WallProof[]>([]);
  const [loadingProofs, setLoadingProofs] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [displayConfig, setDisplayConfig] = useState<WallDisplayConfig>({
    layout: (wall.layout as WallDisplayConfig["layout"]) || "masonry",
    theme: (wall.theme as WallDisplayConfig["theme"]) || "dark",
    columns: 3,
    showSourceBadges: wall.show_platform_icon,
    showVerifiedTags: true,
    showTimeContext: true,
    showBranding: wall.show_branding,
    borderRadius: wall.border_radius,
    cardSpacing: wall.card_spacing,
    showPlatformIcon: wall.show_platform_icon,
  });

  const togglePreview = async () => {
    if (!showPreview && wallProofs.length === 0) {
      setLoadingProofs(true);
      try {
        const token = await getToken();
        if (token) {
          const proofs = await listWallProofs(wall.id, token);
          setWallProofs(proofs.map(proofToWallProof));
        }
      } catch {
        // ignore
      } finally {
        setLoadingProofs(false);
      }
    }
    setShowPreview(!showPreview);
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      await updateWallConfig(
        wall.id,
        {
          theme: displayConfig.theme,
          border_radius: displayConfig.borderRadius,
          card_spacing: displayConfig.cardSpacing,
          show_platform_icon: displayConfig.showSourceBadges,
          show_branding: displayConfig.showBranding,
          bg_color: wall.bg_color,
          transparent_bg: wall.transparent_bg,
          header_text_color: wall.header_text_color,
          subtitle: wall.subtitle,
          show_header: wall.show_header,
          layout: displayConfig.layout,
        },
        token,
      );
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
      onUpdated();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const wallUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/w/${wall.slug}`
      : `/w/${wall.slug}`;

  const embedCode =
    typeof window !== "undefined"
      ? `<script type="text/javascript" src="${window.location.origin}/js/embed.js"></script>\n<iframe id="shipproof-wall-${wall.slug}" src="${window.location.origin}/embed-wall/${wall.slug}" frameborder="0" scrolling="no" width="100%"></iframe>`
      : "";

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(wallUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [embedCopied, setEmbedCopied] = useState(false);
  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const handleDelete = async () => {
    const token = await getToken();
    if (!token) return;
    await deleteWall(wall.id, token);
    onUpdated();
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-5 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      {/* Header: name + actions */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-[var(--text-primary)]">{wall.name}</h4>
        <div className="flex items-center gap-3">
          <button
            onClick={togglePreview}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
              showPreview
                ? "bg-[#6366F1] text-white"
                : "bg-[var(--bg-surface)] border border-[var(--border)] text-[var(--text-primary)] hover:opacity-80"
            }`}
          >
            {loadingProofs ? "Loading..." : showPreview ? "Hide Preview" : "Preview"}
          </button>
          <button
            onClick={() => router.push(`/dashboard/products/${product.id}/walls/${wall.id}`)}
            className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:opacity-80 transition-all"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg bg-[#ef4444] px-3 py-1.5 text-xs font-medium text-white hover:opacity-85 transition-all"
          >
            Delete
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          {proofCount}
        </div>
      </div>

      {/* Editor Preview */}
      {showPreview && (
        <div className="space-y-3">
          <WallEditorPreview
            proofs={wallProofs}
            config={displayConfig}
            onConfigChange={setDisplayConfig}
          />
          <div className="flex justify-end">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Settings"}
            </button>
          </div>
        </div>
      )}

      {/* Wall URL */}
      <div className="flex items-center gap-2">
        <a
          href={wallUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#6366F1] hover:text-[#818CF8] truncate"
        >
          {wallUrl}
        </a>
        <button
          onClick={handleCopy}
          className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:opacity-80 transition-all flex-shrink-0"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>

      {/* Embed Code */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-[var(--text-primary)]">Embed Code</p>
        <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-3">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-[var(--text-tertiary)]">Copy and paste into your website</p>
            <button
              onClick={handleCopyEmbed}
              className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:opacity-80 transition-all"
            >
              {embedCopied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="text-xs text-[var(--text-secondary)] overflow-x-auto font-mono">
            {embedCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
