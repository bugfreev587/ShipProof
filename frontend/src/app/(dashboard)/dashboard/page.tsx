"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRef } from "react";
import { listProducts, listProofs, createProduct, uploadAvatar, getCurrentUser, getAnalytics, ApiError, type Product, type User, type ViewAnalytics } from "@/lib/api";
import UpgradeNudgeModal from "@/components/upgrade-nudge-modal";

const PLAN_LIMITS: Record<string, { products: number; proofs: string }> = {
  free: { products: 1, proofs: "1" },
  pro: { products: 1, proofs: "Unlimited" },
  business: { products: 10, proofs: "Unlimited" },
};

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [totalProofs, setTotalProofs] = useState(0);
  const [analytics, setAnalytics] = useState<ViewAnalytics | null>(null);
  const [showSpaceBreakdown, setShowSpaceBreakdown] = useState(false);
  const [showWallBreakdown, setShowWallBreakdown] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nudge, setNudge] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const fetchData = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [productsData, userData] = await Promise.all([
        listProducts(token),
        getCurrentUser(token),
      ]);
      setProducts(productsData);
      setUser(userData);

      // Sum proofs across all products + fetch analytics
      const [proofCounts, analyticsData] = await Promise.all([
        Promise.all(
          productsData.map((p) => listProofs(p.id, token).then((proofs) => proofs.length).catch(() => 0))
        ),
        getAnalytics(token).catch(() => null),
      ]);
      setTotalProofs(proofCounts.reduce((a, b) => a + b, 0));
      setAnalytics(analyticsData);
    } catch {
      // handle error silently for now
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const plan = user?.plan || "free";
  const limits = PLAN_LIMITS[plan] || PLAN_LIMITS.free;
  const planLabel = plan.charAt(0).toUpperCase() + plan.slice(1);
  const proofDisplay = limits.proofs === "Unlimited" ? `${totalProofs}` : `${totalProofs}/${limits.proofs}`;

  return (
    <div>
      {/* OVERVIEW */}
      <div className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
          Overview
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Total Proofs */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--text-secondary)]">Total Proofs</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-tertiary)]">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {proofDisplay}
            </div>
          </div>

          {/* Total Products */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--text-secondary)]">Total Products</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-tertiary)]">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                <path d="M8 21h8M12 17v4" />
              </svg>
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)]">
              {products.length}<span className="text-base font-normal text-[var(--text-tertiary)]">/{limits.products}</span>
            </div>
          </div>

          {/* Current Plan */}
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--text-secondary)]">Current Plan</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-tertiary)]">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                <path d="M1 10h22" />
              </svg>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-bold text-[var(--text-primary)]">{planLabel}</span>
              {plan !== "business" && (
                <Link
                  href="/dashboard/settings?tab=billing"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#6366F1] px-3 py-1.5 text-sm font-medium text-[#6366F1] hover:bg-[#6366F1] hover:text-white transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.915a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.816-1.915a2 2 0 001.272-1.272L12 3z" />
                  </svg>
                  Upgrade
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PERFORMANCE */}
      {analytics && (
        <div className="mb-10">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)] mb-4">
            Performance
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Space Views */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[var(--text-secondary)]">Space Views</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-tertiary)]">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {analytics.space_views}
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setShowSpaceBreakdown(!showSpaceBreakdown)}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showSpaceBreakdown ? "Hide" : "Show"} breakdown
                </button>
                {showSpaceBreakdown && (
                  <div className="mt-2 space-y-1">
                    {analytics.space_breakdown.length > 0 ? analytics.space_breakdown.map((s) => (
                      <div key={s.entity_id} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)] truncate mr-2">{s.entity_name || "Unnamed"}</span>
                        <span className="text-[var(--text-primary)] font-medium tabular-nums">{s.view_count}</span>
                      </div>
                    )) : (
                      <div className="text-xs text-[var(--text-tertiary)]">No views yet</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Wall Views */}
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-[var(--text-secondary)]">Wall Views</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-tertiary)]">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">
                {analytics.wall_views}
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setShowWallBreakdown(!showWallBreakdown)}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showWallBreakdown ? "Hide" : "Show"} breakdown
                </button>
                {showWallBreakdown && (
                  <div className="mt-2 space-y-1">
                    {analytics.wall_breakdown.length > 0 ? analytics.wall_breakdown.map((w) => (
                      <div key={w.entity_id} className="flex items-center justify-between text-sm">
                        <span className="text-[var(--text-secondary)] truncate mr-2">{w.entity_name || "Unnamed"}</span>
                        <span className="text-[var(--text-primary)] font-medium tabular-nums">{w.view_count}</span>
                      </div>
                    )) : (
                      <div className="text-xs text-[var(--text-tertiary)]">No views yet</div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PRODUCTS */}
      <div className="mb-8 flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
          Products
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors"
        >
          + New Product
        </button>
      </div>

      {loading ? (
        <div className="text-[var(--text-secondary)]">Loading...</div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-12 text-center">
          <p className="text-[var(--text-secondary)]">
            No products yet. Create your first product to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/dashboard/products/${product.id}`}
              className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6 hover:border-[var(--border-hover)] transition-colors"
            >
              <div className="flex items-center gap-3">
                {product.logo_url?.Valid ? (
                  <img src={product.logo_url.String} alt="" className="h-10 w-10 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#6366F1] text-white font-semibold text-lg">
                    {product.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                  {product.name}
                </h2>
              </div>
              <div className="mt-2 flex items-center gap-4 text-sm text-[var(--text-secondary)]">
                <span>
                  Created{" "}
                  {new Date(product.created_at).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {showModal && (
        <NewProductModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            fetchData();
          }}
          onPlanLimit={(msg) => {
            setShowModal(false);
            setNudge({ open: true, message: msg });
          }}
        />
      )}

      <UpgradeNudgeModal
        open={nudge.open}
        onClose={() => setNudge({ open: false, message: "" })}
        message={nudge.message}
      />
    </div>
  );
}

function NewProductModal({
  onClose,
  onCreated,
  onPlanLimit,
}: {
  onClose: () => void;
  onCreated: () => void;
  onPlanLimit: (message: string) => void;
}) {
  const { getToken } = useAuth();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = await getToken();
      if (!token) return;
      const uploadedUrl = await uploadAvatar(file, token);
      setLogoUrl(uploadedUrl);
    } catch {
      setError("Failed to upload logo. Please try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      await createProduct(
        { name: name.trim(), url: url.trim() || undefined, description: description.trim() || undefined, logo_url: logoUrl || undefined },
        token,
      );
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402) {
        onPlanLimit(err.message);
        return;
      }
      setError("Failed to create product. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
          New Product
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                  className="text-sm text-[#6366F1] hover:text-[#818CF8] transition-colors disabled:opacity-50"
                >
                  {logoUrl ? "Change" : "Upload"}
                </button>
                {logoUrl && (
                  <button
                    type="button"
                    onClick={() => setLogoUrl("")}
                    className="text-sm text-[var(--text-tertiary)] hover:text-[#EF4444] transition-colors"
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
              placeholder="My Awesome Product"
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[#6366F1] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--text-secondary)]">
              URL (optional)
            </label>
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
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your product"
              rows={3}
              className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-tertiary)] focus:border-[#6366F1] focus:outline-none resize-none"
            />
          </div>
          {error && (
            <p className="text-sm text-[#EF4444]">{error}</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading || !name.trim()}
              className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
            >
              {submitting ? "Creating..." : "Create Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
