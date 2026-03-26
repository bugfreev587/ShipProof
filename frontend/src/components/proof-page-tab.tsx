"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import {
  getProofPageConfig,
  updateProofPageConfig,
  listProofPageProofs,
  addProofToProofPage,
  removeProofFromProofPage,
  reorderProofPageProofs,
  listProofs,
  updateProofPageSlug,
  checkProofPageSlug,
  type Product,
  type Proof,
  type ProofPageConfig,
} from "@/lib/api";

interface Props {
  product: Product;
  onPlanLimit?: (message: string) => void;
}

export default function ProofPageTab({ product }: Props) {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Config state
  const [config, setConfig] = useState<ProofPageConfig>({
    proof_page_title: "",
    proof_page_subtitle: "",
    proof_page_theme: "dark",
    proof_page_show_form: true,
    proof_page_form_heading: "",
    proof_page_show_branding: true,
    proof_page_cta_text: "",
    proof_page_cta_url: "",
  });

  // Proof lists
  const [allProofs, setAllProofs] = useState<Proof[]>([]);
  const [pageProofs, setPageProofs] = useState<Proof[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Copy + slug state
  const [copied, setCopied] = useState(false);
  const [currentSlug, setCurrentSlug] = useState("");
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugInput, setSlugInput] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugCheckTimer, setSlugCheckTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const pageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${currentSlug || product.slug}`
      : `/p/${currentSlug || product.slug}`;

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [cfg, proofs, ppProofs] = await Promise.all([
        getProofPageConfig(product.id, token),
        listProofs(product.id, token),
        listProofPageProofs(product.id, token),
      ]);
      setConfig(cfg);
      if (cfg.proof_page_slug) setCurrentSlug(cfg.proof_page_slug);
      setAllProofs(proofs.filter((p) => p.status === "approved"));
      setPageProofs(ppProofs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken, product.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      await updateProofPageConfig(product.id, config, token);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      setError("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleAddSelected = async () => {
    const token = await getToken();
    if (!token || selectedIds.size === 0) return;
    setError("");
    try {
      const startOrder = pageProofs.length;
      let i = 0;
      for (const id of selectedIds) {
        await addProofToProofPage(product.id, id, startOrder + i, token);
        i++;
      }
      setSelectedIds(new Set());
      await fetchData();
    } catch {
      setError("Failed to add proofs.");
    }
  };

  const handleRemove = async (proofId: string) => {
    const token = await getToken();
    if (!token) return;
    try {
      await removeProofFromProofPage(product.id, proofId, token);
      await fetchData();
    } catch {
      setError("Failed to remove proof.");
    }
  };

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const token = await getToken();
    if (!token) return;
    const reordered = [...pageProofs];
    [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
    setPageProofs(reordered);
    try {
      await reorderProofPageProofs(
        product.id,
        reordered.map((p, i) => ({ proof_id: p.id, display_order: i })),
        token,
      );
    } catch {
      setError("Failed to reorder.");
    }
  };

  const handleMoveDown = async (index: number) => {
    if (index >= pageProofs.length - 1) return;
    const token = await getToken();
    if (!token) return;
    const reordered = [...pageProofs];
    [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
    setPageProofs(reordered);
    try {
      await reorderProofPageProofs(
        product.id,
        reordered.map((p, i) => ({ proof_id: p.id, display_order: i })),
        token,
      );
    } catch {
      setError("Failed to reorder.");
    }
  };

  // Available = approved proofs not already on the page
  const pageProofIds = new Set(pageProofs.map((p) => p.id));
  const availableProofs = allProofs.filter((p) => !pageProofIds.has(p.id));

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return <div className="text-[var(--text-secondary)]">Loading...</div>;
  }

  const inputCls =
    "w-full rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none";
  const labelCls = "block text-xs font-medium text-[var(--text-secondary)] mb-1";

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* 1. Proof Link */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Proof Page Link</h3>
        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm truncate font-mono flex items-center">
            <span className="text-[var(--text-tertiary)]">shipproof.io/p/</span>
            <span className="text-[#6366F1] font-semibold">{currentSlug || product.slug}</span>
          </div>
          <button
            onClick={handleCopy}
            className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:opacity-80 transition-all flex-shrink-0"
          >
            {copied ? "Copied!" : "Copy"}
          </button>
          <a
            href={pageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors flex-shrink-0"
          >
            Preview
          </a>
        </div>

        {/* Slug customization */}
        {!editingSlug ? (
          <button
            onClick={() => { setEditingSlug(true); setSlugInput(currentSlug || product.slug); setSlugAvailable(null); }}
            className="text-xs text-[#6366F1] hover:text-[#818CF8] font-medium transition-colors"
          >
            Customize link
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-[var(--text-tertiary)]">shipproof.io/p/</span>
              <input
                type="text"
                value={slugInput}
                onChange={(e) => {
                  const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "");
                  setSlugInput(val);
                  setSlugAvailable(null);
                  if (slugCheckTimer) clearTimeout(slugCheckTimer);
                  if (val.length >= 3) {
                    const timer = setTimeout(async () => {
                      try {
                        const token = await getToken();
                        if (!token) return;
                        const res = await checkProofPageSlug(product.id, val, token);
                        setSlugAvailable(res.available);
                      } catch { setSlugAvailable(null); }
                    }, 500);
                    setSlugCheckTimer(timer);
                  }
                }}
                placeholder="myapp"
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] font-mono focus:border-[#6366F1] focus:outline-none"
              />
              <button
                onClick={async () => {
                  if (slugInput.length < 3 || slugAvailable === false) return;
                  setSlugSaving(true);
                  try {
                    const token = await getToken();
                    if (!token) return;
                    await updateProofPageSlug(product.id, slugInput, token);
                    setCurrentSlug(slugInput);
                    setEditingSlug(false);
                  } catch {
                    setError("Failed to update slug.");
                  } finally {
                    setSlugSaving(false);
                  }
                }}
                disabled={slugSaving || slugInput.length < 3 || slugAvailable === false}
                className="rounded-lg bg-[#6366F1] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
              >
                {slugSaving ? "..." : "Save"}
              </button>
              <button
                onClick={() => setEditingSlug(false)}
                className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]"
              >
                Cancel
              </button>
            </div>
            <div className="text-xs">
              {slugInput.length > 0 && slugInput.length < 3 && (
                <span className="text-[var(--text-tertiary)]">Min 3 characters</span>
              )}
              {slugAvailable === true && (
                <span className="text-[#22C55E]">Available!</span>
              )}
              {slugAvailable === false && (
                <span className="text-[#EF4444]">Already taken</span>
              )}
            </div>
            <p className="text-[11px] text-[var(--text-tertiary)]">
              3-20 chars, lowercase letters, numbers, and hyphens only.
            </p>
          </div>
        )}

        <p className="text-xs text-[var(--text-tertiary)]">
          Share this link anywhere — Twitter bio, email, PH maker comment.
        </p>
      </div>

      {/* 2. Page Settings */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-5 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Page Settings</h3>

        <div>
          <label className={labelCls}>Title</label>
          <input
            type="text"
            value={config.proof_page_title}
            onChange={(e) => setConfig({ ...config, proof_page_title: e.target.value })}
            placeholder={`See why users love ${product.name}`}
            className={inputCls}
          />
        </div>

        <div>
          <label className={labelCls}>Subtitle</label>
          <input
            type="text"
            value={config.proof_page_subtitle}
            onChange={(e) => setConfig({ ...config, proof_page_subtitle: e.target.value })}
            placeholder="Read the impact from those who matter most — our users."
            className={inputCls}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Theme</label>
            <select
              value={config.proof_page_theme}
              onChange={(e) => setConfig({ ...config, proof_page_theme: e.target.value })}
              className={inputCls}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="dim">Dim</option>
              <option value="gray">Gray</option>
            </select>
          </div>

          <div>
            <label className={labelCls}>Show Collection Form</label>
            <button
              onClick={() => setConfig({ ...config, proof_page_show_form: !config.proof_page_show_form })}
              className={`mt-1 w-12 h-6 rounded-full transition-colors relative ${
                config.proof_page_show_form ? "bg-[#6366F1]" : "bg-[var(--border)]"
              }`}
            >
              <span
                className={`block w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                  config.proof_page_show_form ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {config.proof_page_show_form && (
          <div>
            <label className={labelCls}>Form Heading</label>
            <input
              type="text"
              value={config.proof_page_form_heading}
              onChange={(e) => setConfig({ ...config, proof_page_form_heading: e.target.value })}
              placeholder={`Used ${product.name}? Share your experience`}
              className={inputCls}
            />
          </div>
        )}

        {/* CTA Button */}
        <div>
          <label className={labelCls}>CTA Button Text</label>
          <input
            type="text"
            value={config.proof_page_cta_text}
            onChange={(e) => setConfig({ ...config, proof_page_cta_text: e.target.value })}
            placeholder='e.g. "Get Started", "Try it Free", "Visit Website"'
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>CTA Button Link</label>
          <input
            type="url"
            value={config.proof_page_cta_url}
            onChange={(e) => setConfig({ ...config, proof_page_cta_url: e.target.value })}
            placeholder="https://yourproduct.com"
            className={inputCls}
          />
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Add a call-to-action button so visitors can go directly to your product.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="rounded-lg bg-[#6366F1] px-5 py-2 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Settings"}
          </button>
        </div>
      </div>

      {/* 3. Select Proofs — two-panel UI */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-5 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">Select Proofs</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Left: Available */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-[var(--text-primary)]">
                Available ({availableProofs.length})
              </h4>
              <button
                onClick={handleAddSelected}
                disabled={selectedIds.size === 0}
                className="rounded-lg bg-[#6366F1] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#818CF8] disabled:opacity-40 transition-colors"
              >
                Add selected &rarr;
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-1">
              {availableProofs.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">
                  No available proofs. Approve some proofs first.
                </p>
              ) : (
                availableProofs.map((proof) => (
                  <label
                    key={proof.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--bg-surface)] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.has(proof.id)}
                      onChange={() => toggleSelect(proof.id)}
                      className="rounded accent-[#6366F1]"
                    />
                    {proof.author_avatar_url ? (
                      <img
                        src={proof.author_avatar_url}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#6366F1]/20 flex items-center justify-center text-xs text-[#6366F1] flex-shrink-0">
                        {proof.author_name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <span className="text-xs font-medium text-[var(--text-primary)] flex-shrink-0">
                      {proof.author_name}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)] truncate">
                      {proof.content_text?.slice(0, 60) || "—"}
                    </span>
                  </label>
                ))
              )}
            </div>
          </div>

          {/* Right: On Page */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-base)] p-4 space-y-3">
            <h4 className="text-sm font-medium text-[var(--text-primary)]">
              On Page ({pageProofs.length})
            </h4>

            <div className="max-h-72 overflow-y-auto space-y-1">
              {pageProofs.length === 0 ? (
                <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">
                  No proofs on the page yet.
                </p>
              ) : (
                pageProofs.map((proof, idx) => (
                  <div
                    key={proof.id}
                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--bg-surface)] transition-colors"
                  >
                    {/* Move up/down */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button
                        onClick={() => handleMoveUp(idx)}
                        disabled={idx === 0}
                        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 text-xs leading-none"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => handleMoveDown(idx)}
                        disabled={idx === pageProofs.length - 1}
                        className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 text-xs leading-none"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>

                    {proof.author_avatar_url ? (
                      <img
                        src={proof.author_avatar_url}
                        alt=""
                        className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-[#6366F1]/20 flex items-center justify-center text-xs text-[#6366F1] flex-shrink-0">
                        {proof.author_name?.[0]?.toUpperCase() || "?"}
                      </div>
                    )}
                    <span className="text-xs font-medium text-[var(--text-primary)] flex-shrink-0">
                      {proof.author_name}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)] truncate flex-1">
                      {proof.content_text?.slice(0, 50) || "—"}
                    </span>

                    <button
                      onClick={() => handleRemove(proof.id)}
                      className="text-[var(--text-tertiary)] hover:text-red-400 text-sm flex-shrink-0 transition-colors"
                      title="Remove"
                    >
                      ✕
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
