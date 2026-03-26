"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  getProduct,
  getProofPageConfig,
  updateProofPageConfig,
  listProofPageProofs,
  addProofToProofPage,
  removeProofFromProofPage,
  reorderProofPageProofs,
  listProofs,
  getCurrentUser,
  updateProofPageSlug,
  checkProofPageSlug,
  type Product,
  type Proof,
  type ProofPageConfig,
} from "@/lib/api";
import { getWallThemeColors } from "@/components/wall-of-proof/types";
import type { WallProof, ThemeColors } from "@/components/wall-of-proof/types";
import WallMasonry from "@/components/wall-of-proof/wall-masonry";

/* ---------- helpers ---------- */

function toWallProof(proof: Proof): WallProof {
  return {
    id: proof.id,
    author_name: proof.author_name,
    author_title: typeof proof.author_title === "string" ? proof.author_title : null,
    author_avatar_url: typeof proof.author_avatar_url === "string" ? proof.author_avatar_url : null,
    content_text: typeof proof.content_text === "string" ? proof.content_text : null,
    content_image_url: typeof proof.content_image_url === "string" ? proof.content_image_url : null,
    source_platform: proof.source_platform,
    source_url: proof.source_url,
    rating: proof.rating,
    is_verified: proof.collection_method === "submission",
    created_at: proof.created_at,
    tags: proof.tags,
  };
}

const inputCls =
  "w-full rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-2.5 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none";
const labelCls = "block text-xs font-medium text-[var(--text-secondary)] mb-1";

/* ---------- component ---------- */

export default function ProofPageEditorPage() {
  const { id: productId } = useParams<{ id: string }>();
  const { getToken } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
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
  const [allProofs, setAllProofs] = useState<Proof[]>([]);
  const [pageProofs, setPageProofs] = useState<Proof[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [proofSearch, setProofSearch] = useState("");
  const [proofTab, setProofTab] = useState<"available" | "onpage">("available");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Slug state
  const [currentSlug, setCurrentSlug] = useState("");
  const [copied, setCopied] = useState(false);
  const [editingSlug, setEditingSlug] = useState(false);
  const [slugInput, setSlugInput] = useState("");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [slugSaving, setSlugSaving] = useState(false);
  const [slugCheckTimer, setSlugCheckTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Mobile preview toggle
  const [showPreview, setShowPreview] = useState(false);

  // Track original page proof ids for save diff
  const [originalPageProofIds, setOriginalPageProofIds] = useState<Set<string>>(new Set());

  const pageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/p/${currentSlug || product?.slug || ""}`
      : `/p/${currentSlug || product?.slug || ""}`;

  /* ---------- data fetching ---------- */

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [prod, cfg, ppProofs, proofs] = await Promise.all([
        getProduct(productId, token),
        getProofPageConfig(productId, token),
        listProofPageProofs(productId, token),
        listProofs(productId, token),
        getCurrentUser(token),
      ]);
      setProduct(prod);
      setConfig(cfg);
      if (cfg.proof_page_slug) setCurrentSlug(cfg.proof_page_slug);
      setAllProofs(proofs.filter((p: Proof) => p.status === "approved"));
      setPageProofs(ppProofs);
      setOriginalPageProofIds(new Set(ppProofs.map((p: Proof) => p.id)));
    } catch {
      setError("Failed to load proof page data.");
    } finally {
      setLoading(false);
    }
  }, [getToken, productId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  /* ---------- slug handlers ---------- */

  const handleCopy = () => {
    navigator.clipboard.writeText(pageUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSlugChange = (val: string) => {
    const clean = val.toLowerCase().replace(/[^a-z0-9-]/g, "");
    setSlugInput(clean);
    setSlugAvailable(null);
    if (slugCheckTimer) clearTimeout(slugCheckTimer);
    if (clean.length >= 3) {
      const timer = setTimeout(async () => {
        try {
          const token = await getToken();
          if (!token) return;
          const res = await checkProofPageSlug(productId, clean, token);
          setSlugAvailable(res.available);
        } catch {
          setSlugAvailable(null);
        }
      }, 500);
      setSlugCheckTimer(timer);
    }
  };

  const handleSlugSave = async () => {
    if (slugInput.length < 3 || slugAvailable === false) return;
    setSlugSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      await updateProofPageSlug(productId, slugInput, token);
      setCurrentSlug(slugInput);
      setEditingSlug(false);
    } catch {
      setError("Failed to update slug.");
    } finally {
      setSlugSaving(false);
    }
  };

  /* ---------- proof selection handlers ---------- */

  const pageProofIds = new Set(pageProofs.map((p) => p.id));
  const availableProofs = allProofs.filter((p) => !pageProofIds.has(p.id));

  const filteredAvailable = proofSearch
    ? availableProofs.filter(
        (p) =>
          p.author_name.toLowerCase().includes(proofSearch.toLowerCase()) ||
          (p.content_text || "").toLowerCase().includes(proofSearch.toLowerCase()),
      )
    : availableProofs;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleAddSelected = () => {
    if (selectedIds.size === 0) return;
    const toAdd = allProofs.filter((p) => selectedIds.has(p.id));
    setPageProofs((prev) => [...prev, ...toAdd]);
    setSelectedIds(new Set());
  };

  const handleRemove = (proofId: string) => {
    setPageProofs((prev) => prev.filter((p) => p.id !== proofId));
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    setPageProofs((prev) => {
      const reordered = [...prev];
      [reordered[index - 1], reordered[index]] = [reordered[index], reordered[index - 1]];
      return reordered;
    });
  };

  const handleMoveDown = (index: number) => {
    if (index >= pageProofs.length - 1) return;
    setPageProofs((prev) => {
      const reordered = [...prev];
      [reordered[index], reordered[index + 1]] = [reordered[index + 1], reordered[index]];
      return reordered;
    });
  };

  /* ---------- save ---------- */

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;

      // 1. Save config
      await updateProofPageConfig(productId, config, token);

      // 2. Compute adds / removes
      const currentIds = new Set(pageProofs.map((p) => p.id));
      const toAdd = pageProofs.filter((p) => !originalPageProofIds.has(p.id));
      const toRemove = [...originalPageProofIds].filter((id) => !currentIds.has(id));

      for (const id of toRemove) {
        await removeProofFromProofPage(productId, id, token);
      }
      for (let i = 0; i < toAdd.length; i++) {
        await addProofToProofPage(productId, toAdd[i].id, pageProofs.indexOf(toAdd[i]), token);
      }

      // 3. Reorder
      if (pageProofs.length > 0) {
        await reorderProofPageProofs(
          productId,
          pageProofs.map((p, i) => ({ proof_id: p.id, display_order: i })),
          token,
        );
      }

      setOriginalPageProofIds(currentIds);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  /* ---------- preview data ---------- */

  const themeColors: ThemeColors = getWallThemeColors(config.proof_page_theme);
  const wallProofs: WallProof[] = pageProofs.map(toWallProof);

  /* ---------- loading / error states ---------- */

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-secondary)]">
        Loading...
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          {error || "Product not found."}
        </div>
        <Link
          href={`/dashboard/products/${productId}`}
          className="mt-4 inline-block text-sm text-[#6366F1] hover:text-[#818CF8]"
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  /* ---------- proof row renderer ---------- */

  const ProofRow = ({ proof, checkbox }: { proof: Proof; checkbox?: boolean }) => (
    <div className="flex items-center gap-2">
      {checkbox && (
        <input
          type="checkbox"
          checked={selectedIds.has(proof.id)}
          onChange={() => toggleSelect(proof.id)}
          className="rounded accent-[#6366F1] flex-shrink-0"
        />
      )}
      {proof.author_avatar_url ? (
        <img src={proof.author_avatar_url} alt="" className="w-6 h-6 rounded-full object-cover flex-shrink-0" />
      ) : (
        <div className="w-6 h-6 rounded-full bg-[#6366F1]/20 flex items-center justify-center text-xs text-[#6366F1] flex-shrink-0">
          {proof.author_name?.[0]?.toUpperCase() || "?"}
        </div>
      )}
      <span className="text-xs font-medium text-[var(--text-primary)] flex-shrink-0">{proof.author_name}</span>
      <span className="text-xs text-[var(--text-tertiary)] truncate">{proof.content_text?.slice(0, 60) || "\u2014"}</span>
    </div>
  );

  /* ---------- render ---------- */

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      {/* Header */}
      <Link
        href={`/dashboard/products/${productId}?tab=proof-page`}
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to {product.name}
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Proof Page Editor</h1>
        {/* Mobile preview toggle */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="lg:hidden rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)]"
        >
          {showPreview ? "Show Editor" : "Show Preview"}
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 mb-4">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: "calc(100vh - 200px)" }}>
        {/* ============ LEFT PANEL ============ */}
        <div className={`w-full lg:w-[40%] lg:min-w-[360px] flex-shrink-0 overflow-y-auto space-y-6 ${showPreview ? "hidden lg:block" : ""}`}>
          {/* --- Proof Link --- */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Proof Page Link</h3>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm truncate font-mono flex items-center">
                <span className="text-[var(--text-tertiary)]">shipproof.io/p/</span>
                <span className="text-[#6366F1] font-semibold">{currentSlug || product.slug}</span>
              </div>
              <button
                onClick={handleCopy}
                className="rounded-lg bg-[var(--card)] border border-[var(--border)] px-3 py-2 text-xs font-medium text-[var(--text-primary)] hover:opacity-80 transition-all flex-shrink-0"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

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
                    onChange={(e) => handleSlugChange(e.target.value)}
                    placeholder="myapp"
                    className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] font-mono focus:border-[#6366F1] focus:outline-none"
                  />
                  <button
                    onClick={handleSlugSave}
                    disabled={slugSaving || slugInput.length < 3 || slugAvailable === false}
                    className="rounded-lg bg-[#6366F1] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
                  >
                    {slugSaving ? "..." : "Save"}
                  </button>
                  <button onClick={() => setEditingSlug(false)} className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)]">
                    Cancel
                  </button>
                </div>
                <div className="text-xs">
                  {slugInput.length > 0 && slugInput.length < 3 && <span className="text-[var(--text-tertiary)]">Min 3 characters</span>}
                  {slugAvailable === true && <span className="text-[#22C55E]">Available!</span>}
                  {slugAvailable === false && <span className="text-[#EF4444]">Already taken</span>}
                </div>
                <p className="text-[11px] text-[var(--text-tertiary)]">3-20 chars, lowercase letters, numbers, and hyphens only.</p>
              </div>
            )}
          </div>

          {/* --- Page Settings --- */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-5">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Page Settings</h3>

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
                placeholder="Read the impact from those who matter most."
                className={inputCls}
              />
            </div>

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
              <label className={labelCls}>CTA Button Text</label>
              <input
                type="text"
                value={config.proof_page_cta_text}
                onChange={(e) => setConfig({ ...config, proof_page_cta_text: e.target.value })}
                placeholder='e.g. "Get Started", "Try it Free"'
                className={inputCls}
              />
            </div>

            <div>
              <label className={labelCls}>CTA Button URL</label>
              <input
                type="url"
                value={config.proof_page_cta_url}
                onChange={(e) => setConfig({ ...config, proof_page_cta_url: e.target.value })}
                placeholder="https://yourproduct.com"
                className={inputCls}
              />
            </div>

            <div className="flex items-center justify-between">
              <label className={labelCls + " mb-0"}>Show Collection Form</label>
              <button
                onClick={() => setConfig({ ...config, proof_page_show_form: !config.proof_page_show_form })}
                className={`w-12 h-6 rounded-full transition-colors relative ${
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

            <div>
              <label className={labelCls}>Form Heading</label>
              <input
                type="text"
                value={config.proof_page_form_heading}
                onChange={(e) => setConfig({ ...config, proof_page_form_heading: e.target.value })}
                placeholder={`Used ${product.name}? Share your experience`}
                disabled={!config.proof_page_show_form}
                className={inputCls + (!config.proof_page_show_form ? " opacity-50 cursor-not-allowed" : "")}
              />
            </div>
          </div>

          {/* --- Select Proofs --- */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Select Proofs</h3>

            {/* Tabs */}
            <div className="flex border-b border-[var(--border)]">
              <button
                onClick={() => setProofTab("available")}
                className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  proofTab === "available"
                    ? "border-[#6366F1] text-[#6366F1]"
                    : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                Available ({availableProofs.length})
              </button>
              <button
                onClick={() => setProofTab("onpage")}
                className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 -mb-px ${
                  proofTab === "onpage"
                    ? "border-[#6366F1] text-[#6366F1]"
                    : "border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                }`}
              >
                On Page ({pageProofs.length})
              </button>
            </div>

            {/* Available tab */}
            {proofTab === "available" && (
              <div className="space-y-3">
                <input
                  type="text"
                  value={proofSearch}
                  onChange={(e) => setProofSearch(e.target.value)}
                  placeholder="Search proofs..."
                  className={inputCls}
                />
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {filteredAvailable.length === 0 ? (
                    <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">
                      {availableProofs.length === 0 ? "No available proofs. Approve some proofs first." : "No matches."}
                    </p>
                  ) : (
                    filteredAvailable.map((proof) => (
                      <label
                        key={proof.id}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--bg-surface)] cursor-pointer transition-colors"
                      >
                        <ProofRow proof={proof} checkbox />
                      </label>
                    ))
                  )}
                </div>
                {selectedIds.size > 0 && (
                  <button
                    onClick={handleAddSelected}
                    className="w-full rounded-lg bg-[#6366F1] px-4 py-2 text-xs font-medium text-white hover:bg-[#818CF8] transition-colors"
                  >
                    Add selected ({selectedIds.size})
                  </button>
                )}
              </div>
            )}

            {/* On Page tab */}
            {proofTab === "onpage" && (
              <div className="max-h-64 overflow-y-auto space-y-1">
                {pageProofs.length === 0 ? (
                  <p className="text-xs text-[var(--text-tertiary)] py-4 text-center">No proofs on the page yet.</p>
                ) : (
                  pageProofs.map((proof, idx) => (
                    <div
                      key={proof.id}
                      className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[var(--bg-surface)] transition-colors"
                    >
                      <div className="flex flex-col gap-0.5 flex-shrink-0">
                        <button
                          onClick={() => handleMoveUp(idx)}
                          disabled={idx === 0}
                          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 text-xs leading-none"
                          title="Move up"
                        >
                          &#9650;
                        </button>
                        <button
                          onClick={() => handleMoveDown(idx)}
                          disabled={idx === pageProofs.length - 1}
                          className="text-[var(--text-tertiary)] hover:text-[var(--text-primary)] disabled:opacity-30 text-xs leading-none"
                          title="Move down"
                        >
                          &#9660;
                        </button>
                      </div>
                      <ProofRow proof={proof} />
                      <button
                        onClick={() => handleRemove(proof.id)}
                        className="ml-auto text-[var(--text-tertiary)] hover:text-red-400 text-sm flex-shrink-0 transition-colors"
                        title="Remove"
                      >
                        &#10005;
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* --- Save Button --- */}
          <div className="pb-8">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full rounded-lg bg-[#6366F1] px-5 py-3 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* ============ RIGHT PANEL — LIVE PREVIEW ============ */}
        <div className={`flex-1 overflow-y-auto rounded-xl border border-[var(--border)] ${!showPreview ? "hidden lg:block" : ""}`}>
          <div
            className="min-h-full p-8"
            style={{ backgroundColor: themeColors.bgBase }}
          >
            {/* Preview header */}
            <div className="max-w-3xl mx-auto text-center space-y-4 mb-10">
              {product.logo_url && (
                <img
                  src={typeof product.logo_url === "string" ? product.logo_url : ""}
                  alt={product.name}
                  className="w-12 h-12 rounded-xl mx-auto object-cover"
                />
              )}
              <h2
                className="text-2xl font-bold"
                style={{ color: themeColors.textPrimary }}
              >
                {config.proof_page_title || `See why users love ${product.name}`}
              </h2>
              {(config.proof_page_subtitle) && (
                <p
                  className="text-sm"
                  style={{ color: themeColors.textSecondary }}
                >
                  {config.proof_page_subtitle}
                </p>
              )}
              {config.proof_page_cta_text && (
                <a
                  href={config.proof_page_cta_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg bg-[#6366F1] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors"
                >
                  {config.proof_page_cta_text}
                </a>
              )}
              {/* Stats bar */}
              <div className="flex items-center justify-center gap-6 text-xs" style={{ color: themeColors.textTertiary }}>
                <span>{pageProofs.length} testimonial{pageProofs.length !== 1 ? "s" : ""}</span>
                {pageProofs.some((p) => p.rating) && (
                  <span>
                    Avg{" "}
                    {(
                      pageProofs.filter((p) => p.rating).reduce((s, p) => s + (p.rating || 0), 0) /
                      (pageProofs.filter((p) => p.rating).length || 1)
                    ).toFixed(1)}{" "}
                    / 5
                  </span>
                )}
              </div>
            </div>

            {/* Proof grid */}
            {wallProofs.length > 0 ? (
              <div className="max-w-5xl mx-auto">
                <WallMasonry
                  proofs={wallProofs}
                  theme={themeColors}
                  columns={3}
                  spacing={16}
                  borderRadius={12}
                  showSourceBadges
                  showVerifiedTags
                  showTimeContext
                />
              </div>
            ) : (
              <div
                className="text-center py-16 text-sm"
                style={{ color: themeColors.textTertiary }}
              >
                Add proofs from the left panel to see them here.
              </div>
            )}

            {/* Form mockup */}
            {config.proof_page_show_form && (
              <div className="max-w-lg mx-auto mt-12">
                <div
                  className="rounded-xl p-6 space-y-4"
                  style={{
                    backgroundColor: themeColors.bgCard,
                    border: `1px solid ${themeColors.borderColor}`,
                  }}
                >
                  <h3
                    className="text-lg font-semibold text-center"
                    style={{ color: themeColors.textPrimary }}
                  >
                    {config.proof_page_form_heading || `Used ${product.name}? Share your experience`}
                  </h3>
                  {/* Placeholder inputs */}
                  <div className="space-y-3">
                    <div
                      className="rounded-lg px-4 py-2.5 text-sm"
                      style={{
                        backgroundColor: themeColors.bgBase,
                        border: `1px solid ${themeColors.borderColor}`,
                        color: themeColors.textTertiary,
                      }}
                    >
                      Your name
                    </div>
                    <div
                      className="rounded-lg px-4 py-2.5 text-sm"
                      style={{
                        backgroundColor: themeColors.bgBase,
                        border: `1px solid ${themeColors.borderColor}`,
                        color: themeColors.textTertiary,
                      }}
                    >
                      Your experience...
                    </div>
                    <div
                      className="rounded-lg px-4 py-2.5 text-sm text-center font-medium"
                      style={{
                        backgroundColor: "#6366F1",
                        color: "#ffffff",
                      }}
                    >
                      Submit
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Branding footer */}
            {config.proof_page_show_branding && (
              <div className="text-center mt-10">
                <span className="text-xs" style={{ color: themeColors.textTertiary }}>
                  Powered by{" "}
                  <span className="font-semibold" style={{ color: themeColors.textSecondary }}>
                    ShipProof
                  </span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
