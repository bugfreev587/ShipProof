"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import {
  listEmbeds,
  createEmbed,
  deleteEmbed,
  listEmbedProofs,
  getCurrentUser,
  type Product,
  type Embed,
  ApiError,
} from "@/lib/api";

interface Props {
  product: Product;
  onPlanLimit?: (message: string) => void;
}

const PLAN_LIMITS: Record<string, number> = { free: 1, pro: 3, business: Infinity };

export default function EmbedsTab({ product, onPlanLimit }: Props) {
  const { getToken } = useAuth();
  const router = useRouter();
  const [embeds, setEmbeds] = useState<Embed[]>([]);
  const [proofCounts, setProofCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userPlan, setUserPlan] = useState<"free" | "pro" | "business">("free");
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [items, user] = await Promise.all([
        listEmbeds(product.id, token),
        getCurrentUser(token),
      ]);
      setEmbeds(items);
      setUserPlan(user.plan);

      const counts: Record<string, number> = {};
      await Promise.all(
        items.map(async (embed) => {
          try {
            const proofs = await listEmbedProofs(embed.id, token);
            counts[embed.id] = proofs.length;
          } catch {
            counts[embed.id] = 0;
          }
        }),
      );
      setProofCounts(counts);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [getToken, product.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    const limit = PLAN_LIMITS[userPlan];
    if (embeds.length >= limit) {
      onPlanLimit?.(
        `Your ${userPlan} plan allows up to ${limit} embed${limit !== 1 ? "s" : ""}. Upgrade to create more.`,
      );
      return;
    }
    setShowCreate(true);
  };

  if (loading) {
    return <div className="text-[var(--text-secondary)]">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Embeds</h3>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">
            Create embeddable widgets to showcase proofs on your website.
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors"
        >
          + Create Embed
        </button>
      </div>

      {showCreate && (
        <CreateEmbedForm
          product={product}
          onCreated={() => { setShowCreate(false); fetchData(); }}
          onCancel={() => setShowCreate(false)}
          setError={setError}
          onPlanLimit={onPlanLimit}
        />
      )}

      {embeds.length === 0 && !showCreate ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center text-[var(--text-secondary)]">
          No embeds yet. Create your first embed to showcase proofs on your website!
        </div>
      ) : (
        <div className="space-y-4">
          {embeds.map((embed) => (
            <EmbedCard
              key={embed.id}
              embed={embed}
              product={product}
              proofCount={proofCounts[embed.id] ?? 0}
              onUpdated={fetchData}
              router={router}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* --- Create Embed Form --- */

function CreateEmbedForm({
  product,
  onCreated,
  onCancel,
  setError,
  onPlanLimit,
}: {
  product: Product;
  onCreated: () => void;
  onCancel: () => void;
  setError: (e: string) => void;
  onPlanLimit?: (message: string) => void;
}) {
  const { getToken } = useAuth();
  const [name, setName] = useState("");
  const [layout, setLayout] = useState<"inline_strip" | "wall_grid">("inline_strip");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      await createEmbed(product.id, { name: name.trim(), layout }, token);
      onCreated();
    } catch (err) {
      if (err instanceof ApiError && err.status === 402 && onPlanLimit) {
        onPlanLimit(err.message);
      } else if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setSaving(false);
    }
  };

  const layouts = [
    {
      value: "inline_strip" as const,
      label: "Inline Strip",
      desc: "Horizontal scrolling carousel for embedding in landing pages",
    },
    {
      value: "wall_grid" as const,
      label: "Wall Grid",
      desc: "Vertical masonry grid for showcasing testimonials",
    },
  ];

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5 space-y-4">
      <h4 className="text-sm font-medium text-[var(--text-primary)]">New Embed</h4>

      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
        placeholder="Embed name..."
        autoFocus
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-base)] px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[#6366F1] focus:outline-none"
      />

      <div className="grid grid-cols-2 gap-3">
        {layouts.map((l) => (
          <button
            key={l.value}
            onClick={() => setLayout(l.value)}
            className={`rounded-xl border p-4 text-left transition-all ${
              layout === l.value
                ? "border-[#6366F1] bg-[#6366F1]/10"
                : "border-[var(--border)] bg-[var(--bg-base)] hover:border-[var(--border-hover)]"
            }`}
          >
            <p className="text-sm font-medium text-[var(--text-primary)]">{l.label}</p>
            <p className="text-xs text-[var(--text-tertiary)] mt-1">{l.desc}</p>
          </button>
        ))}
      </div>

      <div className="flex justify-end gap-2">
        <button
          onClick={onCancel}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={saving || !name.trim()}
          className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
        >
          {saving ? "Creating..." : "Create"}
        </button>
      </div>
    </div>
  );
}

/* --- Embed Card --- */

function EmbedCard({
  embed,
  product,
  proofCount,
  onUpdated,
  router,
}: {
  embed: Embed;
  product: Product;
  proofCount: number;
  onUpdated: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  const { getToken } = useAuth();
  const [codeCopied, setCodeCopied] = useState(false);

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const embedCode = `<script type="text/javascript" src="${origin}/js/embed.js"></script>\n<iframe id="shipproof-${embed.slug}" src="${origin}/embed/${embed.slug}" frameborder="0" scrolling="no" width="100%"></iframe>`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(embedCode);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  };

  const handleDelete = async () => {
    const token = await getToken();
    if (!token) return;
    await deleteEmbed(embed.id, token);
    onUpdated();
  };

  const isStrip = embed.layout === "inline_strip";

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.25)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h4 className="text-sm font-medium text-[var(--text-primary)]">{embed.name}</h4>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
              isStrip
                ? "bg-[#6366F1]/15 text-[#818CF8]"
                : "bg-[#3B82F6]/15 text-[#60A5FA]"
            }`}
          >
            {isStrip ? "Inline Strip" : "Wall Grid"}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {proofCount} proof{proofCount !== 1 ? "s" : ""}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyCode}
            className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:opacity-80 transition-all"
          >
            {codeCopied ? "Copied!" : "Copy Code"}
          </button>
          <button
            onClick={() => router.push(`/dashboard/products/${product.id}/embeds/${embed.id}`)}
            className="rounded-lg bg-[var(--bg-surface)] border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] hover:opacity-80 transition-all"
          >
            Edit
          </button>
          <button
            onClick={handleDelete}
            className="rounded-lg bg-[#ef4444] px-3 py-1.5 text-xs font-medium text-white hover:opacity-85 transition-all"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
