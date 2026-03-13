"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import {
  listProofs,
  listSpaces,
  createProofJson,
  createProof,
  updateProof,
  deleteProof,
  toggleProofFeatured,
  addProofTag,
  removeProofTag,
  addProofToSpace,
  removeProofFromSpace,
  listProductTags,
  extractScreenshot,
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
  const [expandedProofId, setExpandedProofId] = useState<string | null>(null);
  const [addToSpaceProof, setAddToSpaceProof] = useState<Proof | null>(null);

  const fetchProofs = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await listProofs(product.id, token);
      setProofs(data);

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
    return <div className="text-[#9CA3AF]">Loading proofs...</div>;
  }

  return (
    <div>
      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Action Bar */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <button
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors"
        >
          + Add Proof
        </button>

        <input
          type="text"
          placeholder="Search proofs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="rounded-lg border border-[#2A2A30] bg-[#1A1A1F] px-3 py-2 text-sm text-[#F1F1F3] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none"
        />

        {allTags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            <button
              onClick={() => setFilterTag("")}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filterTag === ""
                  ? "bg-[#6366F1] text-white"
                  : "bg-[#242429] text-[#9CA3AF] hover:text-[#F1F1F3]"
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
                    : "bg-[#242429] text-[#9CA3AF] hover:text-[#F1F1F3]"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Proof Cards */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-8 text-center text-[#9CA3AF]">
          {proofs.length === 0
            ? "No proofs yet. Add your first proof!"
            : "No proofs match your filters."}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((proof) => {
            const isExpanded = expandedProofId === proof.id;
            return (
              <div
                key={proof.id}
                className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Platform badge */}
                  <PlatformBadge platform={proof.source_platform} />

                  <div className="flex-1 min-w-0">
                    {/* Author */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-[#F1F1F3]">
                        {proof.author_name}
                      </span>
                      {proof.author_title && (
                        <span className="text-xs text-[#6B7280]">
                          {proof.author_title}
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    {proof.content_text && (
                      <p className="text-sm text-[#9CA3AF] mb-2 line-clamp-3">
                        {proof.content_text}
                      </p>
                    )}

                    {proof.content_image_url && (
                      <div className="mb-2">
                        <img
                          src={proof.content_image_url.replace(/^https?:\/\/https?:\/\//, "https://")}
                          alt="Proof screenshot"
                          className="max-h-40 rounded-lg border border-[#2A2A30]"
                        />
                      </div>
                    )}

                    {/* Tags */}
                    {proof.tags && proof.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap mb-2">
                        {proof.tags.map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-[#242429] px-2 py-0.5 text-xs text-[#9CA3AF]"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Source URL */}
                    {proof.source_url && (
                      <a
                        href={proof.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-[#6366F1] hover:text-[#818CF8]"
                      >
                        View source
                      </a>
                    )}
                  </div>

                  {/* Featured toggle */}
                  <button
                    onClick={() => handleToggleFeatured(proof.id)}
                    className={`text-lg ${
                      proof.is_featured
                        ? "text-yellow-400"
                        : "text-[#6B7280] hover:text-yellow-400"
                    } transition-colors`}
                    title={
                      proof.is_featured ? "Unfeature" : "Feature this proof"
                    }
                  >
                    ★
                  </button>
                </div>

                {/* Expanded action bar */}
                {isExpanded && (
                  <div className="mt-3 flex items-center justify-center gap-4 border-t border-[#2A2A30] pt-3">
                    <button
                      onClick={() => {
                        setEditingProof(proof);
                        setExpandedProofId(null);
                      }}
                      className="flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#F1F1F3] transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        setDeletingProof(proof);
                        setExpandedProofId(null);
                      }}
                      className="flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-red-400 transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                    <button
                      onClick={() => {
                        setAddToSpaceProof(proof);
                        setExpandedProofId(null);
                      }}
                      className="flex items-center gap-1.5 text-sm text-[#9CA3AF] hover:text-[#6366F1] transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17 14v6m-3-3h6M6 10h2a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2zm10 0h2a2 2 0 002-2V6a2 2 0 00-2-2h-2a2 2 0 00-2 2v2a2 2 0 002 2zM6 20h2a2 2 0 002-2v-2a2 2 0 00-2-2H6a2 2 0 00-2 2v2a2 2 0 002 2z" />
                      </svg>
                      Add to Space
                    </button>
                  </div>
                )}

                {/* Chevron toggle */}
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() =>
                      setExpandedProofId(isExpanded ? null : proof.id)
                    }
                    className="text-[#6B7280] hover:text-[#F1F1F3] transition-colors p-1"
                  >
                    <svg
                      className={`h-5 w-5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })}
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
          <div className="w-full max-w-sm rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6">
            <h3 className="text-lg font-semibold text-[#F1F1F3] mb-2">
              Delete Proof
            </h3>
            <p className="text-sm text-[#9CA3AF] mb-4">
              Are you sure you want to delete this proof from{" "}
              {deletingProof.author_name}? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingProof(null)}
                className="rounded-lg border border-[#2A2A30] px-4 py-2 text-sm text-[#9CA3AF] hover:text-[#F1F1F3] transition-colors"
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

  const [tab, setTab] = useState<"text" | "url" | "upload">("text");
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [extracted, setExtracted] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [authorName, setAuthorName] = useState(proof?.author_name || "");
  const [authorTitle, setAuthorTitle] = useState(proof?.author_title || "");
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

  const tabs = isEdit
    ? []
    : [
        { key: "text" as const, label: "Paste Text" },
        { key: "url" as const, label: "Paste URL" },
        { key: "upload" as const, label: "Screenshot" },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6">
        <h3 className="text-lg font-semibold text-[#F1F1F3] mb-4">
          {isEdit ? "Edit Proof" : "Add Proof"}
        </h3>

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Tabs (only for add) */}
        {tabs.length > 0 && (
          <div className="mb-4 flex gap-1 border-b border-[#2A2A30]">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-3 py-2 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "border-b-2 border-[#6366F1] text-[#F1F1F3]"
                    : "text-[#9CA3AF] hover:text-[#F1F1F3]"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}

        <div className="space-y-3">
          {/* Author Name */}
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">
              Author Name *
            </label>
            <input
              type="text"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none"
              placeholder="John Doe"
            />
          </div>

          {/* Author Title */}
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">
              Author Title
            </label>
            <input
              type="text"
              value={authorTitle}
              onChange={(e) => setAuthorTitle(e.target.value)}
              className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none"
              placeholder="CEO at Acme Inc."
            />
          </div>

          {/* Platform */}
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">
              Source Platform
            </label>
            <select
              value={sourcePlatform}
              onChange={(e) => setSourcePlatform(e.target.value)}
              className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none"
            >
              {PLATFORMS.map((p) => (
                <option key={p.key} value={p.key}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Content - varies by tab */}
          {(tab === "text" || isEdit) && (
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1">
                Proof Text
              </label>
              <textarea
                value={contentText}
                onChange={(e) => setContentText(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none resize-none"
                placeholder="Paste the testimonial or proof text here..."
              />
            </div>
          )}

          {tab === "url" && !isEdit && (
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1">
                Source URL
              </label>
              <input
                type="url"
                value={sourceURL}
                onChange={(e) => setSourceURL(e.target.value)}
                className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none"
                placeholder="https://twitter.com/user/status/..."
              />
              <div>
                <label className="block text-xs text-[#9CA3AF] mb-1 mt-3">
                  Proof Text
                </label>
                <textarea
                  value={contentText}
                  onChange={(e) => setContentText(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none resize-none"
                  placeholder="Paste the testimonial text..."
                />
              </div>
            </div>
          )}

          {tab === "upload" && !isEdit && (
            <div>
              {imagePreview ? (
                <div>
                  <label className="block text-xs text-[#9CA3AF] mb-1">Preview</label>
                  <div className="relative rounded-lg border border-[#2A2A30] bg-[#0F0F10] p-2">
                    <img
                      src={imagePreview}
                      alt="Screenshot preview"
                      className="max-h-48 w-full rounded object-contain"
                    />
                    {extracting && (
                      <div className="absolute inset-0 flex items-center justify-center bg-[#0F0F10]/60 rounded">
                        <div className="flex items-center gap-2 text-sm text-[#9CA3AF]">
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
                      className="absolute top-3 right-3 rounded-full bg-[#0F0F10]/80 p-1 text-[#9CA3AF] hover:text-[#F1F1F3] transition-colors"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-[#6B7280]">{imageFile?.name}</p>

                  {/* Extracted / editable fields */}
                  <div className="mt-3 space-y-3">
                    <div>
                      <label className="block text-xs text-[#9CA3AF] mb-1">
                        Proof Text
                      </label>
                      <textarea
                        value={contentText}
                        onChange={(e) => setContentText(e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none resize-none"
                        placeholder={extracting ? "Extracting..." : "Extracted text will appear here..."}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Paste zone */}
                  <div
                    onPaste={handlePaste}
                    tabIndex={0}
                    className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#6366F1]/40 bg-[#6366F1]/5 px-4 py-8 text-center hover:border-[#6366F1]/70 hover:bg-[#6366F1]/10 transition-colors focus:outline-none focus:border-[#6366F1]"
                  >
                    <svg className="h-8 w-8 text-[#6366F1]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 0l3-3m-3 3l3 3M3 12a9 9 0 1118 0 9 9 0 01-18 0z" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-[#F1F1F3]">
                        Paste screenshot here
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        Press {navigator?.platform?.includes("Mac") ? "⌘V" : "Ctrl+V"} to paste from clipboard
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Source URL (for text/edit modes) */}
          {(tab === "text" || isEdit) && (
            <div>
              <label className="block text-xs text-[#9CA3AF] mb-1">
                Source URL (optional)
              </label>
              <input
                type="url"
                value={sourceURL}
                onChange={(e) => setSourceURL(e.target.value)}
                className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none"
                placeholder="https://..."
              />
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="block text-xs text-[#9CA3AF] mb-1">Tags</label>
            <div className="flex gap-1 flex-wrap mb-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-[#242429] px-2 py-0.5 text-xs text-[#9CA3AF]"
                >
                  {tag}
                  <button
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="text-[#6B7280] hover:text-red-400"
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
                className="flex-1 rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-1.5 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none"
                placeholder="Type tag + Enter"
              />
            </div>
            {tagSuggestions.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                <span className="text-xs text-[#6B7280] mr-1 self-center">
                  Existing:
                </span>
                {tagSuggestions.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTags([...tags, t])}
                    className="rounded-full border border-[#2A2A30] bg-[#0F0F10] px-2 py-0.5 text-xs text-[#9CA3AF] hover:border-[#6366F1] hover:text-[#6366F1] transition-colors"
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
            className="rounded-lg border border-[#2A2A30] px-4 py-2 text-sm text-[#9CA3AF] hover:text-[#F1F1F3] transition-colors"
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
      <div className="w-full max-w-sm rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6">
        <h3 className="text-lg font-semibold text-[#F1F1F3] mb-4">
          Add to Space
        </h3>

        {loading ? (
          <p className="text-sm text-[#9CA3AF]">Loading spaces...</p>
        ) : spaces.length === 0 ? (
          <p className="text-sm text-[#9CA3AF]">
            No spaces yet. Create a space in the Spaces tab first.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {spaces.map((space) => (
              <label
                key={space.id}
                className="flex items-center gap-3 rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2.5 cursor-pointer hover:border-[#3F3F46] transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedSpaceIds.has(space.id)}
                  onChange={() => toggleSpace(space.id)}
                  className="h-4 w-4 rounded border-[#2A2A30] bg-[#0F0F10] text-[#6366F1] focus:ring-[#6366F1] focus:ring-offset-0"
                />
                <span className="text-sm text-[#F1F1F3]">{space.name}</span>
              </label>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#2A2A30] px-4 py-2 text-sm text-[#9CA3AF] hover:text-[#F1F1F3] transition-colors"
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
