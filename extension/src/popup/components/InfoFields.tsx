import { PLATFORM_OPTIONS } from "../../lib/platform-detect";
import type { Product } from "../../lib/api";

export default function InfoFields({
  platform,
  setPlatform,
  sourceUrl,
  products,
  selectedProductId,
  setSelectedProductId,
  authorName,
  setAuthorName,
}: {
  platform: string;
  setPlatform: (p: string) => void;
  sourceUrl: string;
  products: Product[];
  selectedProductId: string;
  setSelectedProductId: (id: string) => void;
  authorName: string;
  setAuthorName: (n: string) => void;
}) {
  return (
    <div className="space-y-3 mt-4">
      {/* Author Name */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-[#55555C] shrink-0 w-16">Author</label>
        <input
          type="text"
          value={authorName}
          onChange={(e) => setAuthorName(e.target.value)}
          placeholder="Author name"
          className="flex-1 rounded-lg border border-[#1E1E24] bg-[#1A1A1F] px-3 py-1.5 text-[13px] text-[#EDEDEF] placeholder-[#55555C] focus:border-[#6366F1] focus:outline-none transition-colors"
        />
      </div>

      {/* Platform */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-[#55555C] shrink-0 w-16">Platform</label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="flex-1 rounded-lg border border-[#1E1E24] bg-[#1A1A1F] px-3 py-1.5 text-[13px] text-[#EDEDEF] focus:border-[#6366F1] focus:outline-none transition-colors appearance-none"
        >
          {PLATFORM_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Source URL */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-[#55555C] shrink-0 w-16">Source</label>
        <span
          className="flex-1 text-[13px] text-[#8B8B92] truncate"
          title={sourceUrl}
        >
          {sourceUrl || "—"}
        </span>
      </div>

      {/* Product */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-[#55555C] shrink-0 w-16">Product</label>
        {products.length === 0 ? (
          <span className="flex-1 text-[13px] text-[#55555C]">
            No products yet.{" "}
            <a
              href="https://shipproof.io/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#818CF8] hover:text-[#6366F1]"
            >
              Create one
            </a>
          </span>
        ) : (
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="flex-1 rounded-lg border border-[#1E1E24] bg-[#1A1A1F] px-3 py-1.5 text-[13px] text-[#EDEDEF] focus:border-[#6366F1] focus:outline-none transition-colors appearance-none"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
