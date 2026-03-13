"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  listSpaces,
  createSpace,
  updateSpaceConfig,
  deleteSpace,
  addProofToSpace,
  removeProofFromSpace,
  fetchPublicSpaceProofs,
  listWalls,
  createWall,
  deleteWall,
  updateWallConfig,
  listProofs,
  addProofToWall,
  removeProofFromWall,
  type Space,
  type Wall,
  type Proof,
  type Product,
  ApiError,
} from "@/lib/api";

interface Props {
  product: Product;
  onPlanLimit?: (message: string) => void;
  activeSection?: "spaces" | "walls";
}

export default function WidgetWallTab({ product, onPlanLimit, activeSection = "spaces" }: Props) {
  const { getToken } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [s, w] = await Promise.all([
        listSpaces(product.id, token),
        listWalls(product.id, token),
      ]);
      setSpaces(s);
      setWalls(w);
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
    return <div className="text-[#9CA3AF]">Loading...</div>;
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
          onUpdated={fetchData}
          setError={setError}
          onPlanLimit={onPlanLimit}
        />
      ) : (
        <WallsSection
          product={product}
          walls={walls}
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
  onUpdated,
  setError,
  onPlanLimit,
}: {
  product: Product;
  spaces: Space[];
  onUpdated: () => void;
  setError: (e: string) => void;
  onPlanLimit?: (message: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[#F1F1F3]">Spaces</h3>
          <p className="text-xs text-[#6B7280] mt-1">
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
        <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-8 text-center text-[#9CA3AF]">
          No spaces yet. Create your first Space to embed curated proofs!
        </div>
      ) : (
        <div className="space-y-4">
          {spaces.map((space) => (
            <SpaceCard
              key={space.id}
              space={space}
              product={product}
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
        className="rounded-lg border border-[#2A2A30] bg-[#1A1A1F] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none"
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
        className="rounded-lg border border-[#2A2A30] px-3 py-2 text-sm text-[#9CA3AF] hover:text-[#F1F1F3] transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

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

function SpaceProofCard({
  proof,
  isDark,
  showPlatformIcon,
  borderRadius,
}: {
  proof: Proof;
  isDark: boolean;
  showPlatformIcon: boolean;
  borderRadius: number;
}) {
  const [showFull, setShowFull] = useState(false);
  const TEXT_LIMIT = 100;
  const isLong = (proof.content_text?.length ?? 0) > TEXT_LIMIT;

  return (
    <div
      className="flex-shrink-0 border p-3 flex flex-col"
      style={{
        width: "220px",
        height: showFull ? "auto" : "160px",
        minHeight: "160px",
        borderRadius: `${borderRadius}px`,
        borderColor: isDark ? "#2A2A30" : "#E5E7EB",
        background: isDark ? "#242429" : "#FFFFFF",
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        {proof.author_avatar_url ? (
          <img
            src={proof.author_avatar_url}
            alt={proof.author_name}
            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
          />
        ) : showPlatformIcon ? (
          <span
            className={`inline-flex items-center justify-center w-5 h-5 rounded text-[8px] font-bold text-white flex-shrink-0 ${PLATFORM_COLORS[proof.source_platform] || "bg-gray-500"}`}
          >
            {PLATFORM_LABELS[proof.source_platform] || "O"}
          </span>
        ) : null}
        <span
          className="text-xs font-semibold truncate"
          style={{ color: isDark ? "#F1F1F3" : "#111827" }}
        >
          {proof.author_name}
        </span>
      </div>
      {proof.author_title && (
        <p
          className="text-[10px] truncate mb-2"
          style={{ color: isDark ? "#6B7280" : "#9CA3AF" }}
        >
          {proof.author_title}
        </p>
      )}
      {proof.content_text && (
        <div className="flex-1 min-h-0 overflow-hidden mt-1">
          <p
            className="text-[11px] leading-relaxed"
            style={{ color: isDark ? "#9CA3AF" : "#4B5563" }}
          >
            {showFull || !isLong
              ? proof.content_text
              : proof.content_text.slice(0, TEXT_LIMIT) + "..."}
          </p>
          {isLong && (
            <button
              onClick={() => setShowFull(!showFull)}
              className="text-[11px] text-[#6366F1] hover:text-[#818CF8] mt-0.5"
            >
              {showFull ? "less" : "more"}
            </button>
          )}
        </div>
      )}
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
  onUpdated: () => void;
}) {
  const { getToken } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [config, setConfig] = useState(space);
  const [spaceProofs, setSpaceProofs] = useState<Proof[]>([]);
  const [allProofs, setAllProofs] = useState<Proof[]>([]);
  const [spaceProofIds, setSpaceProofIds] = useState<Set<string>>(new Set());
  const [loadingPreview, setLoadingPreview] = useState(true);
  const [loadingAllProofs, setLoadingAllProofs] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const embedUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/embed/${space.slug}`
      : `/embed/${space.slug}`;

  const embedCode = `<iframe src="${embedUrl}" width="100%" height="400" frameborder="0" style="border:none;"></iframe>`;

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Load space proofs for preview on mount
  const fetchSpaceProofs = useCallback(async () => {
    setLoadingPreview(true);
    try {
      const data = await fetchPublicSpaceProofs(space.slug);
      setSpaceProofs(data.proofs);
      setSpaceProofIds(new Set(data.proofs.map((p: Proof) => p.id)));
    } catch {
      // space may have no proofs yet
      setSpaceProofs([]);
      setSpaceProofIds(new Set());
    } finally {
      setLoadingPreview(false);
    }
  }, [space.slug]);

  useEffect(() => {
    fetchSpaceProofs();
  }, [fetchSpaceProofs]);

  // Load all product proofs when expanding
  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (allProofs.length === 0) {
      setLoadingAllProofs(true);
      try {
        const token = await getToken();
        if (!token) return;
        const proofs = await listProofs(product.id, token);
        setAllProofs(proofs);
      } catch {
        // ignore
      } finally {
        setLoadingAllProofs(false);
      }
    }
  };

  const handleConfigChange = (updates: Partial<Space>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const token = await getToken();
      if (!token) return;
      try {
        await updateSpaceConfig(
          space.id,
          {
            theme: newConfig.theme,
            max_items: newConfig.max_items,
            show_platform_icon: newConfig.show_platform_icon,
            border_radius: newConfig.border_radius,
            card_spacing: newConfig.card_spacing,
            show_branding: newConfig.show_branding,
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
        await removeProofFromSpace(space.id, proofId, token);
        setSpaceProofIds((prev) => {
          const next = new Set(prev);
          next.delete(proofId);
          return next;
        });
        setSpaceProofs((prev) => prev.filter((p) => p.id !== proofId));
      } else {
        await addProofToSpace(space.id, proofId, spaceProofIds.size, token);
        setSpaceProofIds((prev) => new Set(prev).add(proofId));
        // Add the proof to preview list
        const proof = allProofs.find((p) => p.id === proofId);
        if (proof) setSpaceProofs((prev) => [...prev, proof]);
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    const token = await getToken();
    if (!token) return;
    await deleteSpace(space.id, token);
    onUpdated();
  };

  const isDark = config.theme === "dark";

  return (
    <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] overflow-hidden">
      {/* Header: name + delete */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h4 className="text-sm font-medium text-[#F1F1F3]">{space.name}</h4>
        <button
          onClick={handleDelete}
          className="text-xs text-[#9CA3AF] hover:text-red-400 transition-colors"
        >
          Delete
        </button>
      </div>

      {/* Horizontal proof preview */}
      <div className="px-4 pb-2">
        {loadingPreview ? (
          <div className="h-24 flex items-center justify-center text-xs text-[#6B7280]">
            Loading preview...
          </div>
        ) : spaceProofs.length === 0 ? (
          <div className="h-24 flex items-center justify-center rounded-lg border border-dashed border-[#2A2A30] text-xs text-[#6B7280]">
            No proofs added yet. Expand to add proofs.
          </div>
        ) : (
          <div
            className="flex overflow-x-auto pb-2"
            style={{ gap: `${config.card_spacing}px`, scrollbarWidth: "thin" }}
          >
            {spaceProofs.map((proof) => (
              <SpaceProofCard
                key={proof.id}
                proof={proof}
                isDark={isDark}
                showPlatformIcon={config.show_platform_icon}
                borderRadius={config.border_radius}
              />
            ))}
          </div>
        )}
      </div>

      {/* Expand chevron */}
      <button
        onClick={handleExpand}
        className="flex items-center justify-center w-full py-2 border-t border-[#2A2A30] text-[#9CA3AF] hover:text-[#F1F1F3] hover:bg-[#242429] transition-colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded panel: config + proofs + embed code */}
      {expanded && (
        <div className="border-t border-[#2A2A30] p-4 space-y-5">
          {/* Widget Configuration */}
          <div className="space-y-4">
            <p className="text-xs font-medium text-[#F1F1F3]">Widget Configuration</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Theme</label>
                <select
                  value={config.theme}
                  onChange={(e) => handleConfigChange({ theme: e.target.value })}
                  className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">
                  Border Radius: {config.border_radius}px
                </label>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={config.border_radius}
                  onChange={(e) =>
                    handleConfigChange({ border_radius: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">
                  Card Spacing: {config.card_spacing}px
                </label>
                <input
                  type="range"
                  min={4}
                  max={32}
                  value={config.card_spacing}
                  onChange={(e) =>
                    handleConfigChange({ card_spacing: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <label className="flex items-center gap-2 text-sm text-[#F1F1F3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.show_platform_icon}
                  onChange={(e) =>
                    handleConfigChange({ show_platform_icon: e.target.checked })
                  }
                  className="rounded border-[#2A2A30]"
                />
                Show platform icons
              </label>

              <label className="flex items-center gap-2 text-sm text-[#F1F1F3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.show_branding}
                  onChange={(e) =>
                    handleConfigChange({ show_branding: e.target.checked })
                  }
                  className="rounded border-[#2A2A30]"
                />
                Show &quot;Powered by ShipProof&quot;
              </label>
            </div>
          </div>

          {/* Manage Proofs */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#F1F1F3]">Proofs</p>
            {loadingAllProofs ? (
              <p className="text-xs text-[#6B7280]">Loading proofs...</p>
            ) : allProofs.length === 0 ? (
              <p className="text-xs text-[#6B7280]">
                No proofs available. Add proofs in the Proofs tab first.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allProofs.map((proof) => (
                  <label
                    key={proof.id}
                    className="flex items-center gap-3 rounded-lg bg-[#0F0F10] p-2.5 cursor-pointer hover:bg-[#242429] transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={spaceProofIds.has(proof.id)}
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

          {/* Embed Code */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#F1F1F3]">Embed Code</p>
            <div className="rounded-lg border border-[#2A2A30] bg-[#0F0F10] p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[#6B7280]">Copy and paste into your website</p>
                <button
                  onClick={handleCopy}
                  className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="text-xs text-[#9CA3AF] overflow-x-auto font-mono">
                {embedCode}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Walls Section (unchanged from original) ─── */

function WallsSection({
  product,
  walls,
  onUpdated,
  setError,
  onPlanLimit,
}: {
  product: Product;
  walls: Wall[];
  onUpdated: () => void;
  setError: (e: string) => void;
  onPlanLimit?: (message: string) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[#F1F1F3]">Wall of Love</h3>
        <CreateWallButton
          product={product}
          onCreated={onUpdated}
          setError={setError}
          onPlanLimit={onPlanLimit}
        />
      </div>

      {walls.length === 0 ? (
        <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-8 text-center text-[#9CA3AF]">
          No walls yet. Create your first Wall of Love!
        </div>
      ) : (
        <div className="space-y-3">
          {walls.map((wall) => (
            <WallCard
              key={wall.id}
              wall={wall}
              product={product}
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
        className="rounded-lg border border-[#2A2A30] bg-[#1A1A1F] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none"
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
        className="rounded-lg border border-[#2A2A30] px-3 py-2 text-sm text-[#9CA3AF] hover:text-[#F1F1F3] transition-colors"
      >
        Cancel
      </button>
    </div>
  );
}

function WallCard({
  wall,
  product,
  onUpdated,
}: {
  wall: Wall;
  product: Product;
  onUpdated: () => void;
}) {
  const { getToken } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [config, setConfig] = useState(wall);
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [wallProofIds, setWallProofIds] = useState<Set<string>>(new Set());
  const [loadingProofs, setLoadingProofs] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const wallUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/w/${wall.slug}`
      : `/w/${wall.slug}`;

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(wallUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (proofs.length === 0) {
      setLoadingProofs(true);
      try {
        const token = await getToken();
        if (!token) return;
        const allProofs = await listProofs(product.id, token);
        setProofs(allProofs);
      } catch {
        // ignore
      } finally {
        setLoadingProofs(false);
      }
    }
  };

  const handleConfigChange = (updates: Partial<Wall>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const token = await getToken();
      if (!token) return;
      try {
        await updateWallConfig(
          wall.id,
          {
            theme: newConfig.theme,
            border_radius: newConfig.border_radius,
            card_spacing: newConfig.card_spacing,
            show_platform_icon: newConfig.show_platform_icon,
            show_branding: newConfig.show_branding,
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
        await removeProofFromWall(wall.id, proofId, token);
        setWallProofIds((prev) => {
          const next = new Set(prev);
          next.delete(proofId);
          return next;
        });
      } else {
        await addProofToWall(wall.id, proofId, wallProofIds.size, token);
        setWallProofIds((prev) => new Set(prev).add(proofId));
      }
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    const token = await getToken();
    if (!token) return;
    await deleteWall(wall.id, token);
    onUpdated();
  };

  return (
    <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] overflow-hidden">
      {/* Header: name + URL + delete */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-1">
          <h4 className="text-sm font-medium text-[#F1F1F3]">{wall.name}</h4>
          <button
            onClick={handleDelete}
            className="text-xs text-[#9CA3AF] hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
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
            className="text-xs text-[#9CA3AF] hover:text-[#F1F1F3] transition-colors flex-shrink-0"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Expand chevron */}
      <button
        onClick={handleExpand}
        className="flex items-center justify-center w-full py-2 border-t border-[#2A2A30] text-[#9CA3AF] hover:text-[#F1F1F3] hover:bg-[#242429] transition-colors"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Expanded panel: config + proofs */}
      {expanded && (
        <div className="border-t border-[#2A2A30] p-4 space-y-5">
          {/* Wall Configuration */}
          <div className="space-y-4">
            <p className="text-xs font-medium text-[#F1F1F3]">Wall Configuration</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">Theme</label>
                <select
                  value={config.theme}
                  onChange={(e) => handleConfigChange({ theme: e.target.value })}
                  className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">
                  Border Radius: {config.border_radius}px
                </label>
                <input
                  type="range"
                  min={0}
                  max={24}
                  value={config.border_radius}
                  onChange={(e) =>
                    handleConfigChange({ border_radius: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">
                  Card Spacing: {config.card_spacing}px
                </label>
                <input
                  type="range"
                  min={4}
                  max={32}
                  value={config.card_spacing}
                  onChange={(e) =>
                    handleConfigChange({ card_spacing: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <label className="flex items-center gap-2 text-sm text-[#F1F1F3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.show_platform_icon}
                  onChange={(e) =>
                    handleConfigChange({ show_platform_icon: e.target.checked })
                  }
                  className="rounded border-[#2A2A30]"
                />
                Show platform icons
              </label>

              <label className="flex items-center gap-2 text-sm text-[#F1F1F3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.show_branding}
                  onChange={(e) =>
                    handleConfigChange({ show_branding: e.target.checked })
                  }
                  className="rounded border-[#2A2A30]"
                />
                Show &quot;Powered by ShipProof&quot;
              </label>
            </div>
          </div>

          {/* Manage Proofs */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#F1F1F3]">Proofs</p>
            {loadingProofs ? (
              <p className="text-xs text-[#6B7280]">Loading proofs...</p>
            ) : proofs.length === 0 ? (
              <p className="text-xs text-[#6B7280]">
                No proofs available. Add proofs in the Proofs tab first.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {proofs.map((proof) => (
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
      )}
    </div>
  );
}
