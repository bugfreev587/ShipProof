"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { updateProduct, type Product } from "@/lib/api";

interface Props {
  product: Product;
  onUpdated: (p: Product) => void;
  onClose: () => void;
}

export default function ProductInfoEditor({ product, onUpdated, onClose }: Props) {
  const { getToken } = useAuth();
  const [saving, setSaving] = useState(false);

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

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-[#F1F1F3]">Edit Product</h2>
          <button
            onClick={onClose}
            className="text-[#9CA3AF] hover:text-[#F1F1F3] transition-colors"
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
          <div>
            <label className="mb-1 block text-sm text-[#9CA3AF]">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] focus:border-[#6366F1] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#9CA3AF]">URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://myproduct.com"
              className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#9CA3AF]">
              Short Description
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="AI-powered prompt optimizer for developers"
              className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#9CA3AF]">
              Detailed Description
            </label>
            <textarea
              value={descriptionLong}
              onChange={(e) => setDescriptionLong(e.target.value)}
              placeholder="2-3 sentences expanding on the core value..."
              rows={3}
              className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none resize-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#9CA3AF]">
              Target Audience
            </label>
            <input
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="e.g. indie hackers who use Claude Code daily"
              className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !name.trim()}
            className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={onClose}
            className="rounded-lg border border-[#2A2A30] px-4 py-2 text-sm text-[#F1F1F3] hover:bg-[#2A2A30] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
