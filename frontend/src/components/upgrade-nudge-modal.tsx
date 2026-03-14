"use client";

import Link from "next/link";

export default function UpgradeNudgeModal({
  open,
  onClose,
  message,
}: {
  open: boolean;
  onClose: () => void;
  message: string;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-6">
        <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">
          Upgrade Required
        </h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">{message}</p>

        <div className="mb-4 rounded-lg border border-[var(--border)] bg-[var(--bg-base)] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-2.5 px-3 text-left font-medium text-[var(--text-tertiary)]"></th>
                <th className="py-2.5 px-3 text-center font-medium text-[var(--text-secondary)]">Free</th>
                <th className="py-2.5 px-3 text-center font-medium text-[#6366F1]">Pro $12/mo</th>
                <th className="py-2.5 px-3 text-center font-medium text-[#F59E0B]">Business $29/mo</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Products", free: "1", pro: "1", biz: "10" },
                { label: "Proofs", free: "1", pro: "Unlimited", biz: "Unlimited" },
                { label: "Spaces", free: "—", pro: "1", biz: "10" },
                { label: "Content Gen", free: "3/mo", pro: "Unlimited", biz: "Unlimited" },
                { label: "Remove Branding", free: "—", pro: "—", biz: "✓" },
              ].map((row, i) => (
                <tr key={row.label} className={i < 4 ? "border-b border-[var(--border)]/50" : ""}>
                  <td className="py-2 px-3 text-left text-[var(--text-secondary)]">{row.label}</td>
                  <td className="py-2 px-3 text-center text-[var(--text-tertiary)]">{row.free}</td>
                  <td className="py-2 px-3 text-center text-[var(--text-primary)]">{row.pro}</td>
                  <td className="py-2 px-3 text-center text-[var(--text-primary)]">{row.biz}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors"
          >
            Maybe Later
          </button>
          <Link
            href="/#pricing"
            className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </div>
  );
}
