"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getWidgetConfig,
  updateWidgetConfig,
  listWalls,
  createWall,
  updateWall,
  deleteWall,
  listProofs,
  addProofToWall,
  removeProofFromWall,
  type WidgetConfig,
  type Wall,
  type Proof,
  type Product,
  ApiError,
} from "@/lib/api";

interface Props {
  product: Product;
}

export default function WidgetWallTab({ product }: Props) {
  const { getToken } = useAuth();
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [walls, setWalls] = useState<Wall[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [cfg, w] = await Promise.all([
        getWidgetConfig(product.id, token),
        listWalls(product.id, token),
      ]);
      setConfig(cfg);
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

  const handleConfigChange = (updates: Partial<WidgetConfig>) => {
    if (!config) return;
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);

    // Debounced save
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const token = await getToken();
      if (!token) return;
      try {
        await updateWidgetConfig(
          product.id,
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

  const embedCode = `<iframe src="${typeof window !== "undefined" ? window.location.origin : ""}/embed/${product.slug}" width="100%" height="400" frameborder="0" style="border:none;"></iframe>`;

  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div className="text-[#9CA3AF]">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Widget Section */}
      <div>
        <h3 className="text-lg font-semibold text-[#F1F1F3] mb-4">
          Embed Widget
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Preview */}
          <div className="rounded-xl border border-[#2A2A30] bg-[#0F0F10] p-4">
            <p className="text-xs text-[#6B7280] mb-2">Preview</p>
            <iframe
              src={`/embed/${product.slug}`}
              className="w-full rounded-lg border border-[#2A2A30]"
              style={{ height: 300 }}
            />
          </div>

          {/* Config Panel */}
          {config && (
            <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-4 space-y-4">
              <p className="text-xs text-[#6B7280]">Configuration</p>

              {/* Theme */}
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">
                  Theme
                </label>
                <select
                  value={config.theme}
                  onChange={(e) => handleConfigChange({ theme: e.target.value })}
                  className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                </select>
              </div>

              {/* Max Items */}
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1">
                  Max Items: {config.max_items}
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={config.max_items}
                  onChange={(e) =>
                    handleConfigChange({ max_items: Number(e.target.value) })
                  }
                  className="w-full"
                />
              </div>

              {/* Border Radius */}
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
                    handleConfigChange({
                      border_radius: Number(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>

              {/* Card Spacing */}
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
                    handleConfigChange({
                      card_spacing: Number(e.target.value),
                    })
                  }
                  className="w-full"
                />
              </div>

              {/* Show Platform Icon */}
              <label className="flex items-center gap-2 text-sm text-[#F1F1F3] cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.show_platform_icon}
                  onChange={(e) =>
                    handleConfigChange({
                      show_platform_icon: e.target.checked,
                    })
                  }
                  className="rounded border-[#2A2A30]"
                />
                Show platform icons
              </label>

              {/* Show Branding */}
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
          )}
        </div>

        {/* Embed Code */}
        <div className="mt-4 rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[#6B7280]">Embed Code</p>
            <button
              onClick={handleCopy}
              className="text-xs text-[#6366F1] hover:text-[#818CF8] transition-colors"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <pre className="text-xs text-[#9CA3AF] bg-[#0F0F10] rounded-lg p-3 overflow-x-auto font-mono">
            {embedCode}
          </pre>
        </div>
      </div>

      {/* Wall Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[#F1F1F3]">
            Wall of Love
          </h3>
          <CreateWallButton
            product={product}
            onCreated={fetchData}
            setError={setError}
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
                onUpdated={fetchData}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function CreateWallButton({
  product,
  onCreated,
  setError,
}: {
  product: Product;
  onCreated: () => void;
  setError: (e: string) => void;
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
      if (err instanceof ApiError) {
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
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [wallProofIds, setWallProofIds] = useState<Set<string>>(new Set());
  const [loadingProofs, setLoadingProofs] = useState(false);

  const wallUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/w/${wall.slug}`
      : `/w/${wall.slug}`;

  const handleExpand = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    setLoadingProofs(true);
    try {
      const token = await getToken();
      if (!token) return;
      const allProofs = await listProofs(product.id, token);
      setProofs(allProofs);
      // TODO: fetch wall proofs to know which are already added
      // For now we'll just show all proofs with toggle
    } catch {
      // ignore
    } finally {
      setLoadingProofs(false);
    }
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
    <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-[#F1F1F3]">{wall.name}</h4>
          <a
            href={wallUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#6366F1] hover:text-[#818CF8]"
          >
            {wallUrl}
          </a>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExpand}
            className="text-xs text-[#9CA3AF] hover:text-[#F1F1F3] transition-colors"
          >
            {expanded ? "Collapse" : "Manage Proofs"}
          </button>
          <button
            onClick={handleDelete}
            className="text-xs text-[#9CA3AF] hover:text-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>

      {expanded && (
        <div className="mt-4 border-t border-[#2A2A30] pt-4">
          {loadingProofs ? (
            <p className="text-xs text-[#6B7280]">Loading proofs...</p>
          ) : proofs.length === 0 ? (
            <p className="text-xs text-[#6B7280]">
              No proofs available. Add proofs in the Proofs tab first.
            </p>
          ) : (
            <div className="space-y-2">
              {proofs.map((proof) => (
                <label
                  key={proof.id}
                  className="flex items-center gap-3 rounded-lg bg-[#0F0F10] p-2 cursor-pointer hover:bg-[#242429] transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={wallProofIds.has(proof.id)}
                    onChange={() => handleToggleProof(proof.id)}
                    className="rounded border-[#2A2A30]"
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
      )}
    </div>
  );
}
