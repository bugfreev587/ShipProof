"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";
import {
  listProofs,
  createProofJson,
  createProof,
  updateProof,
  deleteProof,
  toggleProofFeatured,
  addProofTag,
  removeProofTag,
  type Proof,
  type Product,
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
}

export default function ProofsTab({ product }: Props) {
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
        p.content_text.Valid && p.content_text.String.toLowerCase().includes(q);
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
          {filtered.map((proof) => (
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
                    {proof.author_title.Valid && (
                      <span className="text-xs text-[#6B7280]">
                        {proof.author_title.String}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  {proof.content_text.Valid && (
                    <p className="text-sm text-[#9CA3AF] mb-2 line-clamp-3">
                      {proof.content_text.String}
                    </p>
                  )}

                  {proof.content_image_url.Valid && (
                    <div className="mb-2">
                      <img
                        src={proof.content_image_url.String}
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
                  {proof.source_url.Valid && (
                    <a
                      href={proof.source_url.String}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#6366F1] hover:text-[#818CF8]"
                    >
                      View source
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
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
                  <button
                    onClick={() => setEditingProof(proof)}
                    className="text-sm text-[#9CA3AF] hover:text-[#F1F1F3] transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingProof(proof)}
                    className="text-sm text-[#9CA3AF] hover:text-red-400 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
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
                Delete
              </button>
            </div>
          </div>
        </div>
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
}: {
  product: Product;
  proof: Proof | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { getToken } = useAuth();
  const isEdit = !!proof;

  const [tab, setTab] = useState<"text" | "url" | "upload">("text");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Form fields
  const [authorName, setAuthorName] = useState(proof?.author_name || "");
  const [authorTitle, setAuthorTitle] = useState(
    proof?.author_title.Valid ? proof.author_title.String : "",
  );
  const [contentText, setContentText] = useState(
    proof?.content_text.Valid ? proof.content_text.String : "",
  );
  const [sourceURL, setSourceURL] = useState(
    proof?.source_url.Valid ? proof.source_url.String : "",
  );
  const [sourcePlatform, setSourcePlatform] = useState(
    proof?.source_platform || "other",
  );
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(proof?.tags || []);
  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleAddTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) {
      setTags([...tags, t]);
    }
    setTagInput("");
  };

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
      } else if (imageFile) {
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
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Failed to save proof");
      }
    } finally {
      setSaving(false);
    }
  };

  const tabs = isEdit
    ? []
    : [
        { key: "text" as const, label: "Paste Text" },
        { key: "url" as const, label: "Paste URL" },
        { key: "upload" as const, label: "Upload Screenshot" },
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
              <label className="block text-xs text-[#9CA3AF] mb-1">
                Screenshot
              </label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-[#9CA3AF] file:mr-4 file:rounded-lg file:border-0 file:bg-[#6366F1] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#818CF8]"
              />
              <p className="mt-1 text-xs text-[#6B7280]">
                Max 5MB. JPG, PNG, WebP, or GIF.
              </p>
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
