"use client";

import { useAuth } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import Link from "next/link";
import { listProducts, createProduct, ApiError, type Product } from "@/lib/api";
import UpgradeNudgeModal from "@/components/upgrade-nudge-modal";

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [nudge, setNudge] = useState<{ open: boolean; message: string }>({
    open: false,
    message: "",
  });

  const fetchProducts = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const data = await listProducts(token);
      setProducts(data);
    } catch {
      // handle error silently for now
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[#F1F1F3]">Products</h1>
        <button
          onClick={() => setShowModal(true)}
          className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors"
        >
          + New Product
        </button>
      </div>

      {loading ? (
        <div className="text-[#9CA3AF]">Loading...</div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-12 text-center">
          <p className="text-[#9CA3AF]">
            No products yet. Create your first product to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {products.map((product) => (
            <Link
              key={product.id}
              href={`/dashboard/products/${product.id}`}
              className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6 hover:border-[#3F3F46] transition-colors"
            >
              <h2 className="text-lg font-semibold text-[#F1F1F3]">
                {product.name}
              </h2>
              <div className="mt-2 flex items-center gap-4 text-sm text-[#9CA3AF]">
                <span>0 proofs</span>
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
            fetchProducts();
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
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      await createProduct(
        { name: name.trim(), url: url.trim() || undefined, description: description.trim() || undefined },
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
      <div className="w-full max-w-md rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#F1F1F3]">
          New Product
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm text-[#9CA3AF]">
              Product Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Awesome Product"
              className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[#9CA3AF]">
              URL (optional)
            </label>
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
              Description (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="A brief description of your product"
              rows={3}
              className="w-full rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3] placeholder-[#6B7280] focus:border-[#6366F1] focus:outline-none resize-none"
            />
          </div>
          {error && (
            <p className="text-sm text-[#EF4444]">{error}</p>
          )}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-[#2A2A30] px-4 py-2 text-sm text-[#F1F1F3] hover:bg-[#2A2A30] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !name.trim()}
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
