"use client";

import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  getProof,
  getProduct,
  updateProof,
  deleteProof,
  approveProof,
  listVersions,
  listProductTags,
  addProofTag,
  removeProofTag,
  type Proof,
  type Product,
} from "@/lib/api";

const PLATFORMS = [
  { key: "product_hunt", label: "Product Hunt" },
  { key: "reddit", label: "Reddit" },
  { key: "twitter", label: "Twitter/X" },
  { key: "hackernews", label: "Hacker News" },
  { key: "indiehackers", label: "IndieHackers" },
  { key: "direct", label: "Direct" },
  { key: "other", label: "Other" },
];

interface Version {
  id: string;
  version_label: string;
}

export default function ProofEditPage() {
  const { id: productId, pid: proofId } = useParams<{ id: string; pid: string }>();
  const { getToken } = useAuth();
  const router = useRouter();

  const [proof, setProof] = useState<Proof | null>(null);
  const [product, setProduct] = useState<Product | null>(null);
  const [versions, setVersions] = useState<Version[]>([]);
  const [existingTags, setExistingTags] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [previewMode, setPreviewMode] = useState<"widget" | "wall">("widget");

  // Form state
  const [contentText, setContentText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorTitle, setAuthorTitle] = useState("");
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState("");
  const [sourcePlatform, setSourcePlatform] = useState("other");
  const [sourceUrl, setSourceUrl] = useState("");
  const [linkedVersionId, setLinkedVersionId] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [p, prod, vers, existTags] = await Promise.all([
        getProof(proofId, token),
        getProduct(productId, token),
        listVersions(productId, token).catch(() => []),
        listProductTags(productId, token).catch(() => []),
      ]);
      setProof(p);
      setProduct(prod);
      setVersions(vers);
      setExistingTags(existTags || []);

      // Populate form
      setContentText(p.content_text || "");
      setAuthorName(p.author_name || "");
      setAuthorTitle(p.author_title || "");
      setAuthorAvatarUrl(p.author_avatar_url || "");
      setSourcePlatform(p.source_platform || "other");
      setSourceUrl(p.source_url || "");
      setLinkedVersionId(p.linked_version_id || "");
      setTags(p.tags || []);
    } catch {
      setError("Failed to load proof.");
    } finally {
      setLoading(false);
    }
  }, [getToken, productId, proofId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async () => {
    if (!authorName.trim()) {
      setError("Author name is required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      await updateProof(
        proofId,
        {
          content_text: contentText,
          author_name: authorName,
          author_title: authorTitle,
          author_avatar_url: authorAvatarUrl || undefined,
          source_platform: sourcePlatform,
          source_url: sourceUrl,
          linked_version_id: linkedVersionId || undefined,
        },
        token,
      );

      // Sync tags
      const oldTags = proof?.tags || [];
      for (const t of oldTags) {
        if (!tags.includes(t)) await removeProofTag(proofId, t, token);
      }
      for (const t of tags) {
        if (!oldTags.includes(t)) await addProofTag(proofId, t, token);
      }

      router.push(`/dashboard/products/${productId}?tab=proofs`);
    } catch {
      setError("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const token = await getToken();
    if (!token) return;
    await deleteProof(proofId, token);
    router.push(`/dashboard/products/${productId}?tab=proofs`);
  };

  const handleApprove = async () => {
    const token = await getToken();
    if (!token) return;
    await approveProof(proofId, token);
    await fetchData();
  };

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  const tagSuggestions = existingTags.filter(
    (t) => !tags.includes(t) && (!tagInput || t.toLowerCase().includes(tagInput.toLowerCase())),
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-secondary)]">
        Loading...
      </div>
    );
  }

  if (!proof || !product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-4 text-red-400">
          {error || "Proof not found."}
        </div>
        <Link
          href={`/dashboard/products/${productId}?tab=proofs`}
          className="mt-4 inline-block text-sm text-[#6366F1] hover:text-[#818CF8]"
        >
          Back to proofs
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-6">
      <Link
        href={`/dashboard/products/${productId}?tab=proofs`}
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors mb-4"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to {product.name} Proofs
      </Link>

      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-6">
        Edit Proof
      </h1>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6" style={{ minHeight: "calc(100vh - 220px)" }}>
        {/* Left — Configuration */}
        <div className="w-full lg:w-[420px] flex-shrink-0 space-y-5">
          {/* Status */}
          {proof.status === "pending" && (
            <div className="rounded-xl border border-[#F59E0B]/30 bg-[#F59E0B]/5 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#F59E0B]" />
                <span className="text-sm font-medium text-[#F59E0B]">Pending Review</span>
              </div>
              <button
                onClick={handleApprove}
                className="rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 px-4 py-1.5 text-sm font-medium text-[#22C55E] hover:bg-[#22C55E]/20 transition-all"
              >
                Approve
              </button>
            </div>
          )}

          {proof.status === "approved" && (
            <div className="flex items-center gap-2 px-1">
              <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
              <span className="text-sm text-[#22C55E]">Approved</span>
            </div>
          )}

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
            {/* Content */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                Content
              </label>
              {proof.content_image_url && (
                <div className="mb-3">
                  <img
                    src={proof.content_image_url.replace(/^https?:\/\/https?:\/\//, "https://")}
                    alt="Proof screenshot"
                    className="w-full rounded-lg border border-[var(--border)]"
                  />
                </div>
              )}
              <textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none resize-y"
                placeholder="Testimonial text..."
              />
            </div>

            {/* Author Name */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Author Name *</label>
              <input
                type="text"
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
                placeholder="e.g. Sarah M."
              />
            </div>

            {/* Author Title */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Author Title</label>
              <input
                type="text"
                value={authorTitle}
                onChange={(e) => setAuthorTitle(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
                placeholder="e.g. Founder, PixelDash"
              />
            </div>

            {/* Author Avatar */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Author Avatar URL</label>
              <div className="flex items-center gap-2">
                {authorAvatarUrl && (
                  <img src={authorAvatarUrl} alt="Avatar" className="w-8 h-8 rounded-full object-cover border border-[var(--border)]" />
                )}
                <input
                  type="text"
                  value={authorAvatarUrl}
                  onChange={(e) => setAuthorAvatarUrl(e.target.value)}
                  className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* Platform */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Platform</label>
              <select
                value={sourcePlatform}
                onChange={(e) => setSourcePlatform(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
              >
                {PLATFORMS.map((p) => (
                  <option key={p.key} value={p.key}>{p.label}</option>
                ))}
              </select>
            </div>

            {/* Source URL */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Source URL</label>
              <input
                type="url"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
                placeholder="https://twitter.com/user/status/..."
              />
              {sourceUrl && (
                <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-xs text-[#6366F1] hover:text-[#818CF8]">
                  View source
                </a>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">Tags</label>
              <div className="flex gap-1 flex-wrap mb-2">
                {tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--text-secondary)]">
                    {tag}
                    <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="text-[var(--text-tertiary)] hover:text-red-400">x</button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag(); } }}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
                placeholder="Type tag + Enter"
              />
              {tagSuggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  <span className="text-xs text-[var(--text-tertiary)] mr-1">Existing:</span>
                  {tagSuggestions.map((t) => (
                    <button
                      key={t}
                      onClick={() => setTags([...tags, t])}
                      className="rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-2 py-0.5 text-xs text-[var(--text-secondary)] hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Linked Version */}
            {versions.length > 0 && (
              <div>
                <label className="block text-xs text-[var(--text-secondary)] mb-1">Linked Version</label>
                <select
                  value={linkedVersionId}
                  onChange={(e) => setLinkedVersionId(e.target.value)}
                  className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
                >
                  <option value="">None</option>
                  {versions.map((v) => (
                    <option key={v.id} value={v.id}>{v.version_label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#6366F1] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={() => setShowDeleteDialog(true)}
              className="rounded-lg border border-red-500/30 px-4 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>

        {/* Right — Live Preview */}
        <div className="flex-1 min-w-0">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] overflow-hidden lg:sticky lg:top-24">
            <div className="px-5 py-3 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-sm font-medium text-[var(--text-primary)]">Live Preview</h2>
              <div className="flex gap-1 rounded-lg bg-[var(--bg-base)] p-0.5">
                {(["widget", "wall"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setPreviewMode(mode)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors capitalize ${
                      previewMode === mode
                        ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                        : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                    }`}
                  >
                    {mode === "widget" ? "Widget Card" : "Wall Card"}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-8 flex items-start justify-center min-h-[400px]" style={{ background: "#0C0C0E" }}>
              {previewMode === "widget" ? (
                <WidgetPreviewCard
                  authorName={authorName}
                  authorTitle={authorTitle}
                  authorAvatarUrl={authorAvatarUrl}
                  contentText={contentText}
                  contentImageUrl={proof.content_image_url}
                  sourcePlatform={sourcePlatform}
                />
              ) : (
                <WallPreviewCard
                  authorName={authorName}
                  authorTitle={authorTitle}
                  authorAvatarUrl={authorAvatarUrl}
                  contentText={contentText}
                  contentImageUrl={proof.content_image_url}
                  sourcePlatform={sourcePlatform}
                  tags={tags}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Delete Proof</h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Are you sure you want to delete this proof? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- Preview Cards ---

const PLATFORM_COLORS: Record<string, string> = {
  product_hunt: "#FF6154",
  reddit: "#FF4500",
  twitter: "#3F3F46",
  hackernews: "#FF6600",
  indiehackers: "#3B82F6",
  direct: "#22C55E",
  other: "#6B7280",
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

function WidgetPreviewCard({
  authorName,
  authorTitle,
  authorAvatarUrl,
  contentText,
  contentImageUrl,
  sourcePlatform,
}: {
  authorName: string;
  authorTitle: string;
  authorAvatarUrl: string;
  contentText: string;
  contentImageUrl: string | null;
  sourcePlatform: string;
}) {
  return (
    <div
      className="flex flex-col"
      style={{
        width: "300px",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #2A2A30",
        background: "#1A1A1F",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            fontSize: "12px",
            fontWeight: 700,
            color: "white",
            background: PLATFORM_COLORS[sourcePlatform] || "#6B7280",
            flexShrink: 0,
          }}
        >
          {authorAvatarUrl ? (
            <img src={authorAvatarUrl} alt="" style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            PLATFORM_LABELS[sourcePlatform] || "O"
          )}
        </span>
        <div>
          <div style={{ fontSize: "15px", fontWeight: 700, color: "#F1F1F3" }}>
            {authorName || "Author name"}
          </div>
          {authorTitle && (
            <div style={{ fontSize: "13px", color: "#6B7280", marginTop: "3px" }}>
              {authorTitle}
            </div>
          )}
        </div>
      </div>
      {contentText && (
        <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#9CA3AF", margin: 0 }}>
          {contentText}
        </p>
      )}
      {contentImageUrl && (
        <img
          src={contentImageUrl.replace(/^https?:\/\/https?:\/\//, "https://")}
          alt="Proof"
          style={{ marginTop: "8px", maxWidth: "100%", borderRadius: "8px" }}
        />
      )}
    </div>
  );
}

function WallPreviewCard({
  authorName,
  authorTitle,
  authorAvatarUrl,
  contentText,
  contentImageUrl,
  sourcePlatform,
  tags,
}: {
  authorName: string;
  authorTitle: string;
  authorAvatarUrl: string;
  contentText: string;
  contentImageUrl: string | null;
  sourcePlatform: string;
  tags: string[];
}) {
  return (
    <div
      style={{
        width: "340px",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #2A2A30",
        background: "#1A1A1F",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        {authorAvatarUrl ? (
          <img src={authorAvatarUrl} alt="" style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }} />
        ) : (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              fontSize: "12px",
              fontWeight: 700,
              color: "white",
              background: PLATFORM_COLORS[sourcePlatform] || "#6B7280",
            }}
          >
            {(authorName || "A").charAt(0).toUpperCase()}
          </span>
        )}
        <div>
          <div style={{ fontSize: "14px", fontWeight: 500, color: "#F1F1F3" }}>
            {authorName || "Author name"}
          </div>
          {authorTitle && (
            <div style={{ fontSize: "12px", color: "#6B7280" }}>
              {authorTitle}
            </div>
          )}
        </div>
      </div>
      {contentText && (
        <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#9CA3AF", margin: 0 }}>
          {contentText}
        </p>
      )}
      {contentImageUrl && (
        <img
          src={contentImageUrl.replace(/^https?:\/\/https?:\/\//, "https://")}
          alt="Proof"
          style={{ marginTop: "12px", maxWidth: "100%", borderRadius: "8px", border: "1px solid #2A2A30" }}
        />
      )}
      {tags.length > 0 && (
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginTop: "12px" }}>
          {tags.map((tag) => (
            <span
              key={tag}
              style={{
                display: "inline-block",
                padding: "2px 8px",
                borderRadius: "9999px",
                background: "#242429",
                fontSize: "11px",
                color: "#9CA3AF",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
      <div style={{ marginTop: "12px", fontSize: "12px", color: "#6B7280" }}>
        {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
      </div>
    </div>
  );
}
