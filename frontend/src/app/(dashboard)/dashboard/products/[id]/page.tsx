"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getProduct, type Product } from "@/lib/api";
import LaunchContentTab from "@/components/launch-content-tab";
import ProofsTab from "@/components/proofs-tab";
import WidgetWallTab from "@/components/widget-wall-tab"; // DEPRECATED: kept for backward compat
import ProofPageTab from "@/components/proof-page-tab";
import EmbedsTab from "@/components/embeds-tab";
import ProductInfoEditor from "@/components/product-info-editor";
import UpgradeNudgeModal from "@/components/upgrade-nudge-modal";

type TabKey = "content" | "proofs" | "proof-page" | "embeds" | "spaces" | "walls";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [embedExpanded, setEmbedExpanded] = useState(false);
  const [nudge, setNudge] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const tabParam = searchParams.get("tab");
  const activeTab: TabKey =
    tabParam === "proofs" || tabParam === "proof-page" || tabParam === "embeds" || tabParam === "spaces" || tabParam === "walls" || tabParam === "content"
      ? tabParam
      : "content";

  // Auto-expand the Embed Widgets section when a sub-tab is active
  useEffect(() => {
    if (activeTab === "spaces" || activeTab === "walls") {
      setEmbedExpanded(true);
    }
  }, [activeTab]);

  const setActiveTab = useCallback(
    (tab: TabKey) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  const handlePlanLimit = (message: string) => {
    setNudge({ open: true, message });
  };

  useEffect(() => {
    async function fetchProduct() {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await getProduct(id, token);
        setProduct(data);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) {
    return <div className="text-[var(--text-secondary)]">Loading...</div>;
  }

  if (!product) {
    return <div className="text-[var(--text-secondary)]">Product not found.</div>;
  }

  return (
    <div className="-mx-12 -mt-10 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Product Header */}
      <div className="flex items-center justify-between px-12 py-7 border-b border-[var(--border)] bg-[var(--color-bg-surface)]">
        <div className="flex items-center gap-3">
          {product.logo_url?.Valid ? (
            <img src={product.logo_url.String} alt="" className="h-10 w-10 rounded-lg object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6366F1] text-white font-semibold text-lg">
              {product.name.charAt(0).toUpperCase()}
            </div>
          )}
          <h1 className="text-2xl font-medium text-[var(--text-primary)]">{product.name}</h1>
        </div>
        <button
          onClick={() => setEditModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-[var(--text-primary)] px-4 py-2 text-sm font-medium text-[var(--bg-base)] hover:opacity-80 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 114 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
          Edit product
        </button>
      </div>

      {/* Sidebar + Content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar — hidden on mobile, shown md+ */}
        <nav className="hidden md:flex w-64 flex-col gap-1.5 p-8 border-r border-[var(--border)]">
          {/* Content */}
          <button
            onClick={() => setActiveTab("content")}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              activeTab === "content"
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium border-l-2 border-l-[#6366F1]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50 border-l-2 border-l-transparent"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3l1.912 5.813a2 2 0 001.272 1.272L21 12l-5.816 1.915a2 2 0 00-1.272 1.272L12 21l-1.912-5.813a2 2 0 00-1.272-1.272L3 12l5.816-1.915a2 2 0 001.272-1.272L12 3z" />
            </svg>
            Content
          </button>

          {/* Proofs */}
          <button
            onClick={() => setActiveTab("proofs")}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              activeTab === "proofs"
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium border-l-2 border-l-[#6366F1]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50 border-l-2 border-l-transparent"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              <path d="M8 10h.01M12 10h.01M16 10h.01" />
            </svg>
            Proofs
          </button>

          {/* Proof Page — full-page editor */}
          <button
            onClick={() => router.push(`/dashboard/products/${id}/proof-page`)}
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50 border-l-2 border-l-transparent"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
            Proof Page
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-auto opacity-40">
              <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>

          {/* Embeds */}
          <button
            onClick={() => setActiveTab("embeds")}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              activeTab === "embeds"
                ? "bg-[var(--bg-elevated)] text-[var(--text-primary)] font-medium border-l-2 border-l-[#6366F1]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]/50 border-l-2 border-l-transparent"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Embeds
          </button>
        </nav>

        {/* Mobile horizontal tabs */}
        <div className="flex md:hidden border-b border-[var(--border)] w-full">
          <button
            onClick={() => setActiveTab("content")}
            className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm transition-colors ${
              activeTab === "content"
                ? "border-b-2 border-[#6366F1] text-[var(--text-primary)] font-medium"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab("proofs")}
            className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm transition-colors ${
              activeTab === "proofs"
                ? "border-b-2 border-[#6366F1] text-[var(--text-primary)] font-medium"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Proofs
          </button>
          <button
            onClick={() => router.push(`/dashboard/products/${id}/proof-page`)}
            className="flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm transition-colors text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Page
          </button>
          <button
            onClick={() => setActiveTab("embeds")}
            className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm transition-colors ${
              activeTab === "embeds"
                ? "border-b-2 border-[#6366F1] text-[var(--text-primary)] font-medium"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Embeds
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-12 py-10">
          {activeTab === "content" && (
            <LaunchContentTab product={product} onPlanLimit={handlePlanLimit} />
          )}
          {activeTab === "proofs" && (
            <ProofsTab product={product} onPlanLimit={handlePlanLimit} />
          )}
          {activeTab === "proof-page" && (
            <ProofPageTab product={product} onPlanLimit={handlePlanLimit} />
          )}
          {activeTab === "embeds" && (
            <EmbedsTab product={product} onPlanLimit={handlePlanLimit} />
          )}
          {/* DEPRECATED: kept for backward compat with old deep links */}
          {(activeTab === "spaces" || activeTab === "walls") && (
            <WidgetWallTab product={product} onPlanLimit={handlePlanLimit} activeSection={activeTab} />
          )}
        </div>
      </div>

      {/* Edit Product Modal */}
      {editModalOpen && (
        <ProductInfoEditor
          product={product}
          onUpdated={(updated) => {
            setProduct(updated);
            setEditModalOpen(false);
          }}
          onClose={() => setEditModalOpen(false)}
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
