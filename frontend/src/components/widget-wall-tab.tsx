"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
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
  listProofs,
  getCurrentUser,
  type Space,
  type Wall,
  type Proof,
  type Product,
  ApiError,
} from "@/lib/api";
import { getThemeColors, type DashboardTheme } from "@/lib/theme";
import { getCompanyLogoUrl } from "@/lib/company-logo";
import { CompanyLogoImg } from "@/components/company-logo";

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
  themeKey,
  showPlatformIcon,
  borderRadius,
  cardWidth,
  cardHeight,
  textFontSize,
  textFont,
  textBold,
}: {
  proof: Proof;
  themeKey: string;
  showPlatformIcon: boolean;
  borderRadius: number;
  cardWidth: number;
  cardHeight: number;
  textFontSize: number;
  textFont: string;
  textBold: boolean;
}) {
  const [showFull, setShowFull] = useState(false);
  const TEXT_LIMIT = 100;
  const isLong = (proof.content_text?.length ?? 0) > TEXT_LIMIT;
  const t = getThemeColors((themeKey || "dark") as DashboardTheme);

  const heightStyle = cardHeight > 0
    ? { height: showFull ? "auto" : `${cardHeight}px`, minHeight: `${cardHeight}px` }
    : { height: showFull ? "auto" : "160px", minHeight: "160px" };

  return (
    <div
      className="flex-shrink-0 border p-3 flex flex-col relative transition-all duration-200 hover:brightness-125 hover:border-[#6366F1]/50"
      style={{
        width: `${cardWidth}px`,
        ...heightStyle,
        borderRadius: `${borderRadius}px`,
        borderColor: t.border,
        background: t.bgElevated,
      }}
    >
      {(() => {
        const logoUrl = getCompanyLogoUrl(proof.author_title);
        return logoUrl ? <CompanyLogoImg url={logoUrl} top="8px" right="8px" /> : null;
      })()}
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
          style={{ color: t.textPrimary }}
        >
          {proof.author_name}
        </span>
      </div>
      {proof.author_title && (
        <p
          className="text-[10px] truncate mb-2"
          style={{ color: t.textTertiary }}
        >
          {proof.author_title}
        </p>
      )}
      {proof.content_text && (
        <div className="flex-1 min-h-0 overflow-hidden mt-1">
          <p
            className="leading-relaxed"
            style={{
              color: t.textSecondary,
              fontSize: `${textFontSize}px`,
              fontFamily: textFont,
              fontWeight: textBold ? 700 : 400,
            }}
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

function AutoFitPreview({
  proofs,
  config,
  loadingPreview,
}: {
  proofs: Proof[];
  config: Space;
  loadingPreview: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(3);

  const cardW = config.card_size || 280;
  const gap = config.card_spacing || 16;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const calc = () => {
      const w = el.clientWidth;
      const count = Math.max(1, Math.floor((w + gap) / (cardW + gap)));
      setVisibleCount(count);
    };
    calc();
    const ro = new ResizeObserver(calc);
    ro.observe(el);
    return () => ro.disconnect();
  }, [cardW, gap]);

  if (loadingPreview) {
    return (
      <div className="px-4 pb-2">
        <div className="h-24 flex items-center justify-center text-xs text-[var(--text-tertiary)]">
          Loading preview...
        </div>
      </div>
    );
  }

  if (proofs.length === 0) {
    return (
      <div className="px-4 pb-2">
        <div className="h-24 flex items-center justify-center rounded-lg border border-dashed border-[var(--border)] text-xs text-[var(--text-tertiary)]">
          No proofs added yet. Expand to add proofs.
        </div>
      </div>
    );
  }

  const displayCount = Math.min(visibleCount, proofs.length);
  const containerW = displayCount * cardW + (displayCount - 1) * gap;

  return (
    <div ref={containerRef} className="px-4 pb-2">
      <div className="flex justify-center">
        <div
          className="flex overflow-hidden"
          style={{
            gap: `${gap}px`,
            maxWidth: `${containerW}px`,
          }}
        >
          {proofs.slice(0, displayCount).map((proof) => (
            <SpaceProofCard
              key={proof.id}
              proof={proof}
              themeKey={config.theme}
              showPlatformIcon={config.show_platform_icon}
              borderRadius={config.border_radius}
              cardWidth={cardW}
              cardHeight={config.card_height || 0}
              textFontSize={config.text_font_size || 13}
              textFont={config.text_font || "Inter"}
              textBold={config.text_bold || false}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

const SPACE_DEFAULTS: Partial<Space> = {
  theme: "dark",
  border_radius: 12,
  card_spacing: 16,
  card_size: 280,
  card_height: 0,
  max_items: 6,
  show_platform_icon: true,
  show_branding: true,
  text_font_size: 13,
  text_font: "Inter",
  text_bold: false,
};

function SpaceCard({
  space,
  product,
  userPlan,
  onUpdated,
}: {
  space: Space;
  product: Product;
  userPlan: "free" | "pro" | "business";
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

  const embedCode = `<iframe src="${embedUrl}" width="100%" frameborder="0" style="border:none;overflow:hidden;" scrolling="no"></iframe>
<script>window.addEventListener("message",function(e){if(e.data&&e.data.type==="shipproof-resize"){document.querySelector('iframe[src*="${space.slug}"]').style.height=e.data.height+"px"}})</script>`;

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
            visible_count: newConfig.visible_count,
            card_size: newConfig.card_size,
            card_height: newConfig.card_height,
            text_font_size: newConfig.text_font_size,
            text_font: newConfig.text_font,
            text_bold: newConfig.text_bold,
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

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden">
      {/* Header: name + delete */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h4 className="text-sm font-medium text-[var(--text-primary)]">{space.name}</h4>
        <button
          onClick={handleDelete}
          className="text-xs text-[var(--text-secondary)] hover:text-red-400 transition-colors"
        >
          Delete
        </button>
      </div>

      {/* Horizontal proof preview */}
      <AutoFitPreview
        proofs={spaceProofs}
        config={config}
        loadingPreview={loadingPreview}
      />

      {/* Expand chevron */}
      <button
        onClick={handleExpand}
        className="flex items-center justify-center w-full py-2 border-t border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
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
        <div className="border-t border-[var(--border)] p-4 space-y-5">
          {/* Widget Configuration */}
          <div className="space-y-4">
            <p className="text-xs font-medium text-[var(--text-primary)]">Widget Configuration</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Theme</label>
                <select
                  value={config.theme}
                  onChange={(e) => handleConfigChange({ theme: e.target.value })}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
                >
                  <option value="dark">Dark</option>
                  <option value="dim">Dim</option>
                  <option value="gray">Gray</option>
                  <option value="light">Light</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
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
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
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

              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  Card Width: {config.card_size || 280}px
                </label>
                <input
                  type="range"
                  min={200}
                  max={420}
                  step={10}
                  value={config.card_size || 280}
                  onChange={(e) =>
                    handleConfigChange({ card_size: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  Card Height: {config.card_height ? `${config.card_height}px` : "Auto"}
                </label>
                <input
                  type="range"
                  min={0}
                  max={500}
                  step={10}
                  value={config.card_height || 0}
                  onChange={(e) =>
                    handleConfigChange({ card_height: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>
            </div>

            {/* Text Style */}
            <p className="text-xs font-medium text-[var(--text-primary)] mt-4">Text Style</p>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  Font Size: {config.text_font_size || 13}px
                </label>
                <input
                  type="range"
                  min={10}
                  max={20}
                  value={config.text_font_size || 13}
                  onChange={(e) =>
                    handleConfigChange({ text_font_size: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Font Family</label>
                <select
                  value={config.text_font || "Inter"}
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

              <div className="flex items-end pb-1">
                <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.text_bold || false}
                    onChange={(e) =>
                      handleConfigChange({ text_bold: e.target.checked })
                    }
                    className="rounded border-[var(--border)]"
                  />
                  Bold
                </label>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-6 gap-y-2">
              <label className="flex items-center gap-2 text-sm text-[var(--text-primary)] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.show_platform_icon}
                  onChange={(e) =>
                    handleConfigChange({ show_platform_icon: e.target.checked })
                  }
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
                    checked={!config.show_branding}
                    disabled={userPlan !== "business"}
                    onChange={(e) =>
                      handleConfigChange({ show_branding: !e.target.checked })
                    }
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

            <button
              onClick={() => handleConfigChange(SPACE_DEFAULTS)}
              className="mt-2 rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] transition-colors"
            >
              Reset to Defaults
            </button>
          </div>

          {/* Manage Proofs */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-[var(--text-primary)]">Proofs</p>
            {loadingAllProofs ? (
              <p className="text-xs text-[var(--text-tertiary)]">Loading proofs...</p>
            ) : allProofs.length === 0 ? (
              <p className="text-xs text-[var(--text-tertiary)]">
                No proofs available. Add proofs in the Proofs tab first.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
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

          {/* Embed Code */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--text-primary)]">Embed Code</p>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-3">
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs text-[var(--text-tertiary)]">Copy and paste into your website</p>
                <button
                  onClick={handleCopy}
                  className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors"
                >
                  {copied ? "Copied!" : "Copy"}
                </button>
              </div>
              <pre className="text-xs text-[var(--text-secondary)] overflow-x-auto font-mono">
                {embedCode}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Walls Section ─── */

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
  const router = useRouter();

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

  const handleDelete = async () => {
    const token = await getToken();
    if (!token) return;
    await deleteWall(wall.id, token);
    onUpdated();
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-sm font-medium text-[var(--text-primary)]">{wall.name}</h4>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/dashboard/products/${product.id}/walls/${wall.id}`)}
            className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-[var(--text-secondary)] hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
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
          className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors flex-shrink-0"
        >
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
    </div>
  );
}
