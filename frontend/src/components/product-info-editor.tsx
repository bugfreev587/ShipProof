"use client";

import { useAuth } from "@clerk/nextjs";
import { useState } from "react";
import { updateProduct, type Product } from "@/lib/api";

interface Props {
  product: Product;
  onUpdated: (p: Product) => void;
}

export default function ProductInfoEditor({ product, onUpdated }: Props) {
  const { getToken } = useAuth();
  const [editing, setEditing] = useState(false);
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
      setEditing(false);
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(product.name);
    setUrl(product.url?.Valid ? product.url.String : "");
    setDescription(product.description?.Valid ? product.description.String : "");
    setDescriptionLong(
      product.description_long?.Valid ? product.description_long.String : "",
    );
    setTargetAudience(
      product.target_audience?.Valid ? product.target_audience.String : "",
    );
    setEditing(false);
  };

  if (!editing) {
    return (
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#F1F1F3]">{product.name}</h1>
          <button
            onClick={() => setEditing(true)}
            className="rounded-md border border-[#2A2A30] px-2 py-1 text-xs text-[#9CA3AF] hover:bg-[#2A2A30] hover:text-[#F1F1F3] transition-colors"
          >
            Edit
          </button>
        </div>
        {product.description?.Valid && (
          <p className="mt-1 text-sm text-[#9CA3AF]">
            {product.description.String}
          </p>
        )}
        {product.url?.Valid && (
          <a
            href={product.url.String}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-[#6366F1] hover:text-[#818CF8]"
          >
            {product.url.String}
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6">
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
          onClick={handleCancel}
          className="rounded-lg border border-[#2A2A30] px-4 py-2 text-sm text-[#F1F1F3] hover:bg-[#2A2A30] transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
