"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState, useCallback } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { getProduct, type Product } from "@/lib/api";
import LaunchContentTab from "@/components/launch-content-tab";
import ProofsTab from "@/components/proofs-tab";
import WidgetWallTab from "@/components/widget-wall-tab";
import ProductInfoEditor from "@/components/product-info-editor";
import UpgradeNudgeModal from "@/components/upgrade-nudge-modal";

type TabKey = "content" | "proofs" | "spaces" | "walls";

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
    tabParam === "proofs" || tabParam === "spaces" || tabParam === "walls" || tabParam === "content"
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
    return <div className="text-[#9CA3AF]">Loading...</div>;
  }

  if (!product) {
    return <div className="text-[#9CA3AF]">Product not found.</div>;
  }

  return (
    <div className="-mx-10 -mt-8 flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Product Header */}
      <div className="flex items-center justify-between px-10 py-6 border-b border-[#2A2A30]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#6366F1] text-white font-semibold text-lg">
            {product.name.charAt(0).toUpperCase()}
          </div>
          <h1 className="text-2xl font-medium text-[#F1F1F3]">{product.name}</h1>
        </div>
        <button
          onClick={() => setEditModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-white px-4 py-2 text-sm font-medium text-[#0F0F10] hover:bg-[#E5E5E5] transition-colors"
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
        <nav className="hidden md:flex w-60 flex-col gap-1 p-6">
          {/* Content */}
          <button
            onClick={() => setActiveTab("content")}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              activeTab === "content"
                ? "bg-[#1A1A1F] text-[#F1F1F3] font-medium"
                : "text-[#9CA3AF] hover:text-[#F1F1F3] hover:bg-[#1A1A1F]"
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
                ? "bg-[#1A1A1F] text-[#F1F1F3] font-medium"
                : "text-[#9CA3AF] hover:text-[#F1F1F3] hover:bg-[#1A1A1F]"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              <path d="M8 10h.01M12 10h.01M16 10h.01" />
            </svg>
            Proofs
          </button>

          {/* Embed Widgets — collapsible parent */}
          <div className="mt-2">
            <button
              onClick={() => {
                if (!embedExpanded) {
                  setEmbedExpanded(true);
                  // If not already on a sub-tab, navigate to spaces
                  if (activeTab !== "spaces" && activeTab !== "walls") {
                    setActiveTab("spaces");
                  }
                } else {
                  setEmbedExpanded(false);
                }
              }}
              className={`flex items-center justify-between w-full rounded-lg px-3 py-2 text-sm transition-colors ${
                activeTab === "spaces" || activeTab === "walls"
                  ? "text-[#F1F1F3] font-medium"
                  : "text-[#9CA3AF] hover:text-[#F1F1F3] hover:bg-[#1A1A1F]"
              }`}
            >
              <span className="flex items-center gap-3">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                Embed Widgets
              </span>
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-200 ${embedExpanded ? "rotate-0" : "-rotate-90"}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>

            {/* Sub-items */}
            {embedExpanded && (
              <div className="ml-4 mt-1 flex flex-col gap-1 border-l border-[#2A2A30] pl-3">
                <button
                  onClick={() => setActiveTab("spaces")}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeTab === "spaces"
                      ? "bg-[#1A1A1F] text-[#F1F1F3] font-medium"
                      : "text-[#9CA3AF] hover:text-[#F1F1F3] hover:bg-[#1A1A1F]"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                  Spaces
                </button>
                <button
                  onClick={() => setActiveTab("walls")}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                    activeTab === "walls"
                      ? "bg-[#1A1A1F] text-[#F1F1F3] font-medium"
                      : "text-[#9CA3AF] hover:text-[#F1F1F3] hover:bg-[#1A1A1F]"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
                  </svg>
                  Wall of Love
                </button>
              </div>
            )}
          </div>
        </nav>

        {/* Mobile horizontal tabs */}
        <div className="flex md:hidden border-b border-[#2A2A30] w-full">
          <button
            onClick={() => setActiveTab("content")}
            className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm transition-colors ${
              activeTab === "content"
                ? "border-b-2 border-[#6366F1] text-[#F1F1F3] font-medium"
                : "text-[#9CA3AF] hover:text-[#F1F1F3]"
            }`}
          >
            Content
          </button>
          <button
            onClick={() => setActiveTab("proofs")}
            className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm transition-colors ${
              activeTab === "proofs"
                ? "border-b-2 border-[#6366F1] text-[#F1F1F3] font-medium"
                : "text-[#9CA3AF] hover:text-[#F1F1F3]"
            }`}
          >
            Proofs
          </button>
          <button
            onClick={() => setActiveTab("spaces")}
            className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm transition-colors ${
              activeTab === "spaces"
                ? "border-b-2 border-[#6366F1] text-[#F1F1F3] font-medium"
                : "text-[#9CA3AF] hover:text-[#F1F1F3]"
            }`}
          >
            Spaces
          </button>
          <button
            onClick={() => setActiveTab("walls")}
            className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm transition-colors ${
              activeTab === "walls"
                ? "border-b-2 border-[#6366F1] text-[#F1F1F3] font-medium"
                : "text-[#9CA3AF] hover:text-[#F1F1F3]"
            }`}
          >
            Walls
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-12 py-8">
          {activeTab === "content" && (
            <LaunchContentTab product={product} onPlanLimit={handlePlanLimit} />
          )}
          {activeTab === "proofs" && (
            <ProofsTab product={product} onPlanLimit={handlePlanLimit} />
          )}
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
