"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  listProofs,
  listSpaces,
  createProofJson,
  createProof,
  updateProof,
  deleteProof,
  approveProof,
  toggleProofFeatured,
  addProofTag,
  removeProofTag,
  addProofToSpace,
  removeProofFromSpace,
  listProductTags,
  extractScreenshot,
  uploadAvatar,
  getCurrentUser,
  type Proof,
  type Product,
  type Space,
  ApiError,
} from "@/lib/api";

const PLATFORMS = [
  { key: "product_hunt", label: "Product Hunt", color: "bg-red-500" },
  { key: "reddit", label: "Reddit", color: "bg-orange-500" },
  { key: "twitter", label: "Twitter/X", color: "bg-zinc-700" },
  { key: "hackernews", label: "Hacker News", color: "bg-orange-400" },
  { key: "indiehackers", label: "IndieHackers", color: "bg-blue-500" },
  { key: "direct", label: "Direct", color: "bg-green-500" },
  { key: "other", label: "Other", color: "bg-gray-500" },
];

function PlatformBadge({ platform }: { platform: string }) {
  const p = PLATFORMS.find((x) => x.key === platform) || PLATFORMS[6];
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold text-white ${p.color}`}
    >
      {p.label[0]}
    </span>
  );
}

interface Props {
  product: Product;
  onPlanLimit?: (message: string) => void;
}

export default function ProofsTab({ product, onPlanLimit }: Props) {
  const { getToken } = useAuth();
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProof, setEditingProof] = useState<Proof | null>(null);
  const [deletingProof, setDeletingProof] = useState<Proof | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterTag, setFilterTag] = useState("");
  const [allTags, setAllTags] = useState<string[]>([]);
  const [addToSpaceProof, setAddToSpaceProof] = useState<Proof | null>(null);
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "business">("free");
  const [proofLimit, setProofLimit] = useState<number>(5);

  const fetchProofs = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [data, user] = await Promise.all([
        listProofs(product.id, token),
        getCurrentUser(token),
      ]);
      setProofs(data);
      setUserPlan(user.plan);
      const planLimits: Record<string, number> = { free: 5, pro: 0, business: 0 };
      setProofLimit(planLimits[user.plan] ?? 5);

      // Collect all unique tags
      const tags = new Set<string>();
      data.forEach((p) => p.tags?.forEach((t) => tags.add(t)));
      setAllTags(Array.from(tags).sort());
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken, product.id]);

  useEffect(() => {
    fetchProofs();
  }, [fetchProofs]);

  const handleToggleFeatured = async (proofId: string) => {
    const token = await getToken();
    if (!token) return;
    await toggleProofFeatured(proofId, token);
    fetchProofs();
  };

  const handleDelete = async () => {
    if (!deletingProof) return;
    const token = await getToken();
    if (!token) return;
    await deleteProof(deletingProof.id, token);
    setDeletingProof(null);
    fetchProofs();
  };

  const handleApprove = async (proofId: string) => {
    const token = await getToken();
    if (!token) return;
    await approveProof(proofId, token);
    fetchProofs();
  };

  const handleApproveAll = async () => {
    const token = await getToken();
    if (!token) return;
    const pending = proofs.filter((p) => p.status === "pending");
    for (const p of pending) {
      await approveProof(p.id, token);
    }
    fetchProofs();
  };

  // Filter proofs
  const filtered = proofs.filter((p) => {
    if (filterTag && !p.tags?.includes(filterTag)) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchText =
        p.content_text && p.content_text.toLowerCase().includes(q);
      const matchAuthor = p.author_name.toLowerCase().includes(q);
      if (!matchText && !matchAuthor) return false;
    }
    return true;
  });

  if (loading) {
    return <div className="text-[var(--text-secondary)]">Loading proofs...</div>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Proof limit nudge for free plan */}
      {userPlan === "free" && proofLimit > 0 && (
        <div
          className={`mb-4 rounded-lg border px-4 py-3 text-sm flex items-center justify-between ${
            proofs.length >= proofLimit
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : proofs.length >= proofLimit - 1
                ? "bg-[#F59E0B]/10 border-[#F59E0B]/20 text-[#F59E0B]"
                : "bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-secondary)]"
          }`}
        >
          <span>
            {proofs.length}/{proofLimit} proofs used.
            {proofs.length >= proofLimit
              ? " Upgrade to Pro for unlimited proofs."
              : proofs.length >= proofLimit - 1
                ? " Almost at limit. Upgrade to Pro for unlimited proofs."
                : ""}
          </span>
          {proofs.length >= proofLimit - 1 && (
            <a
              href="/#pricing"
              className="ml-3 rounded-lg bg-[#6366F1] px-3 py-1 text-xs font-medium text-white hover:bg-[#818CF8] transition-colors whitespace-nowrap"
            >
              Upgrade
            </a>
          )}
        </div>
      )}

      {/* Action Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search proofs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-lg border border-[var(--border)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[#6366F1] focus:outline-none"
        />

        {allTags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterTag("")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterTag === ""
                  ? "bg-[#6366F1] text-white"
                  : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              All
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag === filterTag ? "" : tag)}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  filterTag === tag
                    ? "bg-[#6366F1] text-white"
                    : "bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        <button
          onClick={() => setShowAddModal(true)}
          disabled={userPlan === "free" && proofLimit > 0 && proofs.length >= proofLimit}
          className="ml-auto rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          + Add Proof
        </button>
      </div>

      {/* Proof Cards — split into Pending and Approved */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center text-[var(--text-secondary)]">
          {proofs.length === 0
            ? "No proofs yet. Add your first proof!"
            : "No proofs match your filters."}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Pending Review Section */}
          {filtered.filter((p) => p.status === "pending").length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-[#F59E0B]">Pending Review</h3>
                <span className="rounded-full bg-[#F59E0B]/10 px-2 py-0.5 text-xs font-medium text-[#F59E0B]">
                  {filtered.filter((p) => p.status === "pending").length}
                </span>
                {filtered.filter((p) => p.status === "pending").length > 1 && (
                  <button
                    onClick={handleApproveAll}
                    className="ml-auto text-sm text-[#22C55E] hover:text-[#16A34A] transition-colors"
                  >
                    Approve All
                  </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.filter((p) => p.status === "pending").map((proof) => (
                  <ProofCard
                    key={proof.id}
                    proof={proof}
                    productId={product.id}
                    isPending
                    onToggleFeatured={() => handleToggleFeatured(proof.id)}
                    onEdit={() => setEditingProof(proof)}
                    onDelete={() => setDeletingProof(proof)}
                    onApprove={() => handleApprove(proof.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Divider between sections */}
          {filtered.some((p) => p.status === "pending") && filtered.some((p) => p.status !== "pending") && (
            <div className="border-t border-[var(--border)]" />
          )}

          {/* Approved Section */}
          {filtered.filter((p) => p.status !== "pending").length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-lg font-semibold text-[var(--text-secondary)]">Approved</h3>
                <span className="rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-xs font-medium text-[var(--text-secondary)]">
                  {filtered.filter((p) => p.status !== "pending").length}
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.filter((p) => p.status !== "pending").map((proof) => (
                  <ProofCard
                    key={proof.id}
                    proof={proof}
                    productId={product.id}
                    isPending={false}
                    onToggleFeatured={() => handleToggleFeatured(proof.id)}
                    onEdit={() => setEditingProof(proof)}
                    onDelete={() => setDeletingProof(proof)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingProof) && (
        <ProofModal
          product={product}
          proof={editingProof}
          onClose={() => {
            setShowAddModal(false);
            setEditingProof(null);
          }}
          onSaved={() => {
            setShowAddModal(false);
            setEditingProof(null);
            fetchProofs();
          }}
          onPlanLimit={onPlanLimit}
        />
      )}

      {/* Delete Confirmation */}
      {deletingProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Delete Proof
            </h3>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Are you sure you want to delete this proof from{" "}
              {deletingProof.author_name}? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingProof(null)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Space Modal */}
      {addToSpaceProof && (
        <AddToSpaceModal
          product={product}
          proof={addToSpaceProof}
          onClose={() => setAddToSpaceProof(null)}
        />
      )}
    </div>
  );
}

// --- Proof Card ---

function ProofCard({
  proof,
  productId,
  isPending,
  onToggleFeatured,
  onEdit,
  onDelete,
  onApprove,
}: {
  proof: Proof;
  productId: string;
  isPending: boolean;
  onToggleFeatured: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onApprove?: () => void;
}) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const platformInfo = PLATFORMS.find((x) => x.key === proof.source_platform) || PLATFORMS[6];

  const handleCardClick = () => {
    router.push(`/dashboard/products/${productId}/proofs/${proof.id}`);
  };

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  const tagsToShow = proof.tags?.slice(0, 3) || [];
  const extraTagCount = (proof.tags?.length || 0) - 3;

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-xl bg-[#141418] border border-[#1E1E24] hover:border-[#2A2A32] p-4 h-[220px] cursor-pointer transition-all duration-150 hover:-translate-y-[2px] flex flex-col ${
        isPending ? "border-l-[3px] border-l-[#F59E0B]" : ""
      }`}
    >
      {/* Top row */}
      <div className="flex items-center gap-2">
        {/* Avatar */}
        {proof.author_avatar_url ? (
          <img
            src={proof.author_avatar_url}
            alt={proof.author_name}
            className="h-8 w-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div
            className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${platformInfo.color}`}
          >
            {proof.author_name[0]?.toUpperCase() || "?"}
          </div>
        )}

        {/* Author info */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[13px] font-medium text-white truncate">
              {proof.author_name}
            </span>
            {isPending && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] flex-shrink-0" />
                <span className="text-[11px] text-[#F59E0B] flex-shrink-0">pending</span>
              </>
            )}
          </div>
          {proof.author_title && (
            <span className="text-xs text-[#8B8B92] truncate block">
              {proof.author_title}
            </span>
          )}
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-1 ml-auto flex-shrink-0">
          {/* Featured star */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFeatured();
            }}
            className={`text-sm p-1 transition-colors ${
              proof.is_featured
                ? "text-yellow-400"
                : "text-[#55555C] hover:text-yellow-400"
            }`}
            title={proof.is_featured ? "Unfeature" : "Feature this proof"}
          >
            ★
          </button>

          {/* More menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="text-[#8B8B92] hover:text-white p-1 transition-colors text-lg leading-none font-bold"
            >
              ⋯
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-[120px] rounded-lg border border-[#2A2A30] bg-[#1A1A1F] shadow-xl py-1">
                {isPending && onApprove && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMenuOpen(false);
                      onApprove();
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs text-[#22C55E] hover:bg-[#242429] transition-colors"
                  >
                    Approve
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onEdit();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-[#EDEDEF] hover:bg-[#242429] transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpen(false);
                    onDelete();
                  }}
                  className="w-full text-left px-3 py-1.5 text-xs text-red-400 hover:bg-[#242429] transition-colors"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Middle content */}
      <div className="flex-1 overflow-hidden mt-2">
        {proof.content_image_url ? (
          <img
            src={proof.content_image_url.replace(/^https?:\/\/https?:\/\//, "https://")}
            alt="Proof screenshot"
            className="object-cover rounded-lg h-full w-full"
          />
        ) : proof.content_text ? (
          <p className="line-clamp-4 text-[13px] text-[#EDEDEF] leading-relaxed">
            {proof.content_text}
          </p>
        ) : null}
      </div>

      {/* Bottom row */}
      <div className="flex items-center justify-between mt-auto pt-2">
        {/* Tag pills */}
        <div className="flex items-center gap-1 min-w-0 overflow-hidden">
          {tagsToShow.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-[var(--bg-elevated)] px-1.5 py-0.5 text-[11px] text-[var(--text-secondary)] whitespace-nowrap flex-shrink-0"
            >
              {tag}
            </span>
          ))}
          {extraTagCount > 0 && (
            <span className="text-[11px] text-[var(--text-tertiary)] flex-shrink-0">
              +{extraTagCount}
            </span>
          )}
        </div>

        {/* Platform badge */}
        <span
          className={`inline-flex items-center justify-center w-4 h-4 rounded text-[8px] font-bold text-white flex-shrink-0 ${platformInfo.color}`}
        >
          {platformInfo.label[0]}
        </span>
      </div>
    </div>
  );
}

// --- Proof Add/Edit Modal ---

function ProofModal({
  product,
  proof,
  onClose,
  onSaved,
  onPlanLimit,
}: {
  product: Product;
  proof: Proof | null;
  onClose: () => void;
  onSaved: () => void;
  onPlanLimit?: (message: string) => void;
}) {
  const { getToken } = useAuth();
  const isEdit = !!proof;

  const [contentMode, setContentMode] = useState<"text" | "screenshot">("text");
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [authorName, setAuthorName] = useState(proof?.author_name || "");
  const [authorTitle, setAuthorTitle] = useState(proof?.author_title || "");
  const [authorAvatarUrl, setAuthorAvatarUrl] = useState(proof?.author_avatar_url || "");
  const [contentText, setContentText] = useState(proof?.content_text || "");
  const [sourceURL, setSourceURL] = useState(proof?.source_url || "");
  const [sourcePlatform, setSourcePlatform] = useState(
    proof?.source_platform || "other",
  );
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(proof?.tags || []);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [existingTags, setExistingTags] = useState<string[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const result = await listProductTags(product.id, token);
        setExistingTags(result || []);
      } catch {
        // ignore
      }
    })();
  }, [getToken, product.id]);

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

  // Suggestions: existing tags not yet selected, filtered by input
  const tagSuggestions = existingTags.filter(
    (t) => !tags.includes(t) && (!tagInput || t.toLowerCase().includes(tagInput.toLowerCase())),
  );

  const handleSubmit = async () => {
    if (!authorName.trim()) {
      setError("Author name is required");
      return;
    }

    setError("");
    setSaving(true);

    try {
      const token = await getToken();
      if (!token) return;

      if (isEdit) {
        await updateProof(
          proof!.id,
          {
            content_text: contentText,
            author_name: authorName,
            author_title: authorTitle,
            author_avatar_url: authorAvatarUrl || undefined,
            source_platform: sourcePlatform,
            source_url: sourceURL,
          },
          token,
        );

        // Sync tags: remove old, add new
        const oldTags = proof!.tags || [];
        for (const t of oldTags) {
          if (!tags.includes(t)) await removeProofTag(proof!.id, t, token);
        }
        for (const t of tags) {
          if (!oldTags.includes(t)) await addProofTag(proof!.id, t, token);
        }
      } else if (imageFile && !extracted) {
        // Upload screenshot as image proof (no extraction happened)
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("author_name", authorName);
        formData.append("author_title", authorTitle);
        if (authorAvatarUrl) formData.append("author_avatar_url", authorAvatarUrl);
        formData.append("content_text", contentText);
        formData.append("source_platform", sourcePlatform);
        formData.append("source_url", sourceURL);
        formData.append("content_type", "image");
        if (tags.length > 0) formData.append("tags", JSON.stringify(tags));
        await createProof(product.id, formData, token);
      } else {
        await createProofJson(
          product.id,
          {
            content_text: contentText,
            author_name: authorName,
            author_title: authorTitle,
            author_avatar_url: authorAvatarUrl || undefined,
            source_platform: sourcePlatform,
            source_url: sourceURL,
            content_type: "text",
            tags,
          },
          token,
        );
      }

      onSaved();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402 && onPlanLimit) {
        onClose();
        onPlanLimit(err.message);
        return;
      }
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to save proof");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleImageSelected = async (file: File | null) => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));

      // Auto-extract text from screenshot
      setExtracting(true);
      try {
        const token = await getToken();
        if (token) {
          const result = await extractScreenshot(file, token);
          // Only fill empty fields
          if (result.author_name && !authorName) setAuthorName(result.author_name);
          if (result.author_title && !authorTitle) setAuthorTitle(result.author_title);
          if (result.content_text && !contentText) setContentText(result.content_text);
          if (result.platform && sourcePlatform === "other") setSourcePlatform(result.platform);
          setExtracted(true);
        }
      } catch {
        // Extraction is best-effort; ignore errors
      } finally {
        setExtracting(false);
      }
    } else {
      setImageFile(null);
      setImagePreview(null);
      setExtracted(false);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) handleImageSelected(file);
        return;
      }
    }
  };

  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const handleAvatarPaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of Array.from(items)) {
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          setUploadingAvatar(true);
          try {
            const token = await getToken();
            if (!token) return;
            const url = await uploadAvatar(file, token);
            setAuthorAvatarUrl(url);
          } catch {
            // Fall back to data URL if upload fails
            const reader = new FileReader();
            reader.onload = () => {
              setAuthorAvatarUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
          } finally {
            setUploadingAvatar(false);
          }
        }
        return;
      }
    }
    // If text was pasted, let it go through (could be a URL)
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          {isEdit ? "Edit Proof" : "Add Proof"}
        </h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className="space-y-3">
          {/* Author Name */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">
              Author Name *
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
              placeholder="John Doe"
            />
          </div>

          {/* Author Title */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">
              Author Title
            </label>
            <input
              type="text"
              value={authorTitle}
              onChange={(e) => setAuthorTitle(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
              placeholder="CEO at Acme Inc."
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">
              Source Platform
            </label>
            <select
              value={sourcePlatform}
              onChange={(e) => setSourcePlatform(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
            >
              {PLATFORMS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Author Avatar */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">
              Author Avatar (optional)
            </label>
            {uploadingAvatar ? (
              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading avatar...
              </div>
            ) : authorAvatarUrl ? (
              <div className="flex items-center gap-3">
                <img
                  src={authorAvatarUrl}
                  alt="Avatar"
                  className="h-10 w-10 rounded-full object-cover border border-[var(--border)]"
                />
                <button
                  type="button"
                  onClick={() => setAuthorAvatarUrl("")}
                  className="text-xs text-[var(--text-secondary)] hover:text-red-400 transition-colors"
                >
                  Remove
                </button>
              </div>
            ) : (
              <div
                onPaste={handleAvatarPaste}
                tabIndex={0}
                className="flex items-center gap-2 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-tertiary)] hover:border-[#6366F1]/40 focus:outline-none focus:border-[#6366F1] transition-colors cursor-text"
              >
                <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0" />
                </svg>
                <input
                  type="text"
                  value={authorAvatarUrl}
                  onChange={(e) => setAuthorAvatarUrl(e.target.value)}
                  onPaste={handleAvatarPaste}
                  placeholder="Paste avatar image or URL"
                  className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Content mode toggle (only for add) */}
          {!isEdit && (
            <div>
              <label className="block text-xs text-[var(--text-secondary)] mb-1">
                Content
              </label>
              <div className="flex gap-1 rounded-lg bg-[var(--bg-base)] p-1 mb-3">
                <button
                  type="button"
                  onClick={() => setContentMode("text")}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    contentMode === "text"
                      ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Paste Text
                </button>
                <button
                  type="button"
                  onClick={() => setContentMode("screenshot")}
                  className={`flex-1 px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    contentMode === "screenshot"
                      ? "bg-[var(--bg-elevated)] text-[var(--text-primary)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  Paste Screenshot
                </button>
              </div>
            </div>
          )}

          {/* Text input */}
          {(contentMode === "text" || isEdit) && (
            <div>
              {isEdit && (
                <label className="block text-xs text-[var(--text-secondary)] mb-1">
                  Proof Text
                </label>
              )}
              <textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none resize-y"
                placeholder="Paste the testimonial or proof text here..."
              />
            </div>
          )}

          {/* Screenshot paste */}
          {contentMode === "screenshot" && !isEdit && (
            <div>
              {imagePreview ? (
                <div>
                  <div className="relative rounded-lg border border-[var(--border)] bg-[var(--bg-base)] p-2">
                    <img
                      src={imagePreview}
                      alt="Screenshot preview"
                      className="max-h-48 w-full rounded object-contain"
                    />
                    {extracting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[var(--bg-base)]/60 rounded">
                        <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                          Extracting text...
                        </div>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleImageSelected(null)}
                      className="absolute top-3 right-3 rounded-full bg-[var(--bg-base)]/80 p-1 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">{imageFile?.name}</p>

                  <div className="mt-3">
                    <label className="block text-xs text-[var(--text-secondary)] mb-1">
                      Proof Text
                    </label>
                    <textarea
                      value={contentText}
                      onChange={(e) => setContentText(e.target.value)}
                      rows={3}
                      className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none resize-none"
                      placeholder={extracting ? "Extracting..." : "Extracted text will appear here..."}
                    />
                  </div>
                </div>
              ) : (
                <div
                  onPaste={handlePaste}
                  tabIndex={0}
                  className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#6366F1]/40 bg-[#6366F1]/5 px-4 py-8 text-center hover:border-[#6366F1]/70 hover:bg-[#6366F1]/10 transition-colors focus:outline-none focus:border-[#6366F1]"
                >
                  <svg className="h-8 w-8 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 0l3-3m-3 3l3 3M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      Paste screenshot here
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">
                      Press {typeof navigator !== "undefined" && navigator?.platform?.includes("Mac") ? "\u2318V" : "Ctrl+V"} to paste from clipboard
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Source URL */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">
              Source URL (optional)
            </label>
            <input
              type="url"
              value={sourceURL}
              onChange={(e) => setSourceURL(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
              placeholder="https://twitter.com/user/status/..."
            />
            <p className="mt-1 text-xs text-[var(--text-tertiary)]">
              Link to the original post. Visitors can click to view the source.
            </p>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs text-[var(--text-secondary)] mb-1">Tags</label>
            <div className="flex gap-1 flex-wrap mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-[var(--bg-elevated)] px-2 py-0.5 text-xs text-[var(--text-secondary)]"
                >
                  {tag}
                  <button
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="text-[var(--text-tertiary)] hover:text-red-400"
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-1.5 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
                placeholder="Type tag + Enter"
              />
            </div>
            {tagSuggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-[var(--text-tertiary)] mr-1 self-center">
                  Existing:
                </span>
                {tagSuggestions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTags([...tags, t])}
                    className="rounded-full border border-[var(--border)] bg-[var(--bg-base)] px-2 py-0.5 text-xs text-[var(--text-secondary)] hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
                  >
                    + {t}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : isEdit ? "Save Changes" : "Add Proof"}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Add to Space Modal ---

function AddToSpaceModal({
  product,
  proof,
  onClose,
}: {
  product: Product;
  proof: Proof;
  onClose: () => void;
}) {
  const { getToken } = useAuth();
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpaceIds, setSelectedSpaceIds] = useState<Set<string>>(new Set());
  const [initialSpaceIds, setInitialSpaceIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const allSpaces = await listSpaces(product.id, token);
        setSpaces(allSpaces);

        // Check which spaces already contain this proof
        const alreadyIn = new Set<string>();
        for (const space of allSpaces) {
          try {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/spaces/${space.id}/proofs`,
              { headers: { Authorization: `Bearer ${token}` } },
            );
            if (res.ok) {
              const spaceProofs = await res.json();
              if (Array.isArray(spaceProofs) && spaceProofs.some((sp: { proof_id: string }) => sp.proof_id === proof.id)) {
                alreadyIn.add(space.id);
              }
            }
          } catch {
            // ignore
          }
        }
        setSelectedSpaceIds(new Set(alreadyIn));
        setInitialSpaceIds(new Set(alreadyIn));
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken, product.id, proof.id]);

  const toggleSpace = (spaceId: string) => {
    setSelectedSpaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(spaceId)) {
        next.delete(spaceId);
      } else {
        next.add(spaceId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;

      // Add to newly selected spaces
      for (const spaceId of selectedSpaceIds) {
        if (!initialSpaceIds.has(spaceId)) {
          await addProofToSpace(spaceId, proof.id, 0, token);
        }
      }
      // Remove from deselected spaces
      for (const spaceId of initialSpaceIds) {
        if (!selectedSpaceIds.has(spaceId)) {
          await removeProofFromSpace(spaceId, proof.id, token);
        }
      }

      onClose();
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-sm rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Add to Space
        </h3>

        {loading ? (
          <p className="text-sm text-[var(--text-secondary)]">Loading spaces...</p>
        ) : spaces.length === 0 ? (
          <p className="text-sm text-[var(--text-secondary)]">
            No spaces yet. Create a space in the Spaces tab first.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {spaces.map((space) => (
              <label
                key={space.id}
                className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2.5 cursor-pointer hover:border-[var(--border-hover)] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSpaceIds.has(space.id)}
                  onChange={() => toggleSpace(space.id)}
                  className="h-4 w-4 rounded border-[var(--border)] bg-[var(--bg-base)] text-[#6366F1] focus:ring-[#6366F1] focus:ring-offset-0"
                />
                <span className="text-sm text-[var(--text-primary)]">{space.name}</span>
              </label>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            Cancel
          </button>
          {spaces.length > 0 && (
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
