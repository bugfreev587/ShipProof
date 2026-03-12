"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProduct, type Product } from "@/lib/api";
import LaunchContentTab from "@/components/launch-content-tab";
import ProofsTab from "@/components/proofs-tab";
import WidgetWallTab from "@/components/widget-wall-tab";
import ProductInfoEditor from "@/components/product-info-editor";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"proofs" | "launch" | "widget">(
    "launch",
  );

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

  const tabs = [
    { key: "launch" as const, label: "Launch Content" },
    { key: "proofs" as const, label: "Proofs" },
    { key: "widget" as const, label: "Widget & Wall" },
  ];

  return (
    <div>
      <div className="mb-2">
        <Link
          href="/dashboard"
          className="text-sm text-[#9CA3AF] hover:text-[#F1F1F3] transition-colors"
        >
          &larr; Back to Products
        </Link>
      </div>

      <ProductInfoEditor
        product={product}
        onUpdated={(updated) => setProduct(updated)}
      />

      <div className="mb-6 flex gap-1 border-b border-[#2A2A30]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-[#6366F1] text-[#F1F1F3]"
                : "text-[#9CA3AF] hover:text-[#F1F1F3]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "proofs" && <ProofsTab product={product} />}
      {activeTab === "launch" && <LaunchContentTab product={product} />}
      {activeTab === "widget" && <WidgetWallTab product={product} />}
    </div>
  );
}
