"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getProduct, type Product } from "@/lib/api";

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { getToken } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"proofs" | "launch" | "widget">(
    "proofs",
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
    { key: "proofs" as const, label: "Proofs" },
    { key: "launch" as const, label: "Launch Content" },
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

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#F1F1F3]">{product.name}</h1>
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

      <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-8 text-center text-[#9CA3AF]">
        {activeTab === "proofs" && (
          <p>Proofs will be available in Phase 3.</p>
        )}
        {activeTab === "launch" && (
          <p>Launch Content Generator will be available in Phase 2.</p>
        )}
        {activeTab === "widget" && (
          <p>Widget & Wall configuration will be available in Phase 3.</p>
        )}
      </div>
    </div>
  );
}
