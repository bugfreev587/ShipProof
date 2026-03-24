"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect, useRef } from "react";
import { updateProduct, uploadAvatar, deleteProduct, type Product } from "@/lib/api";
import { useRouter } from "next/navigation";

interface Props {
  product: Product;
  onUpdated: (p: Product) => void;
  onClose: () => void;
}

export default function ProductInfoEditor({ product, onUpdated, onClose }: Props) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [name, setName] = useState(product.name);
  const [url, setUrl] = useState(product.url?.Valid ? product.url.String : "");
  const [description, setDescription] = useState(
    product.description?.Valid ? product.description.String : "",
  );
  const [descriptionLong, setDescriptionLong] = useState(
    product.description_long?.Valid ? product.description_long.String : "",
  );
  const [targetAudience, setTargetAudience] = useState(
    product.target_audience?.Valid ? product.target_audience.String : "",
  );
  const [logoUrl, setLogoUrl] = useState(
    product.logo_url?.Valid ? product.logo_url.String : "",
  );
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const url = await uploadAvatar(file, token);
      setLogoUrl(url);
    } catch {
      // ignore
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const token = await getToken();
      if (!token) return;
      const updated = await updateProduct(
        product.id,
        {
          name: name.trim(),
          url: url.trim() || undefined,
          description: description.trim() || undefined,
          description_long: descriptionLong.trim() || undefined,
          target_audience: targetAudience.trim() || undefined,
          logo_url: logoUrl || undefined,
        },
        token,
      );
      onUpdated(updated);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const token = await getToken();
      if (!token) return;
      await deleteProduct(product.id, token);
      router.push("/dashboard");
    } catch {
      // ignore
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[var(--text-primary)]">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <p className="mb-4 text-xs text-[#6366F1]">
          This info helps AI generate better launch content.
        </p>

        <div className="space-y-3">
          {/* Logo Upload */}
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">Logo</label>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--bg-base)] overflow-hidden hover:border-[var(--border-hover)] transition-colors"
              >
                {uploading ? (
                  <svg className="h-5 w-5 animate-spin text-[var(--text-tertiary)]" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                ) : logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-tertiary)]">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                )}
              </button>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:opacity-80 disabled:opacity-50 transition-all"
                >
                  {logoUrl ? "Change" : "Upload"}
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="rounded-lg bg-[#ef4444] px-3 py-1.5 text-xs font-medium text-white hover:opacity-85 transition-all"
                  >
                    Remove
                  </button>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://myproduct.com"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[#6366F1] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">
              Short Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="AI-powered prompt optimizer for developers"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[#6366F1] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">
              Detailed Description
            </label>
            <textarea
              value={descriptionLong}
              onChange={(e) => setDescriptionLong(e.target.value)}
              placeholder="2-3 sentences expanding on the core value..."
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[#6366F1] focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. indie hackers who use Claude Code daily"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[#6366F1] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="ml-auto rounded-lg px-4 py-2 text-sm font-medium text-[#ef4444] hover:bg-[#ef4444]/10 transition-colors"
          >
            Delete
          </button>
        </div>

        {showDeleteConfirm && (
          <div className="mt-4 rounded-lg border border-[#ef4444]/30 bg-[#ef4444]/5 p-4">
            <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
              Delete this product?
            </p>
            <p className="text-xs text-[var(--text-secondary)] mb-3">
              This action cannot be undone. All proofs, widgets, and data associated with this product will be permanently deleted.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="rounded-lg bg-[#ef4444] px-4 py-2 text-sm font-medium text-white hover:bg-[#dc2626] disabled:opacity-50 transition-colors"
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
