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
      <div className="w-full max-w-md rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6">
        <h2 className="mb-2 text-lg font-semibold text-[#F1F1F3]">
          Upgrade Required
        </h2>
        <p className="mb-4 text-sm text-[#9CA3AF]">{message}</p>

        <div className="mb-4 rounded-lg border border-[#2A2A30] bg-[#0F0F10] p-4">
          <div className="grid grid-cols-3 gap-3 text-center text-xs">
            <div>
              <div className="mb-1 font-medium text-[#9CA3AF]">Free</div>
              <div className="text-[#6B7280]">1 product</div>
              <div className="text-[#6B7280]">1 proof</div>
              <div className="text-[#6B7280]">3 gens/mo</div>
            </div>
            <div className="border-x border-[#2A2A30] px-3">
              <div className="mb-1 font-medium text-[#6366F1]">Pro $12/mo</div>
              <div className="text-[#9CA3AF]">1 product</div>
              <div className="text-[#9CA3AF]">Unlimited</div>
              <div className="text-[#9CA3AF]">Unlimited</div>
            </div>
            <div>
              <div className="mb-1 font-medium text-[#F59E0B]">Business $29/mo</div>
              <div className="text-[#9CA3AF]">10 products</div>
              <div className="text-[#9CA3AF]">Unlimited</div>
              <div className="text-[#9CA3AF]">Unlimited</div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-[#2A2A30] px-4 py-2 text-sm text-[#F1F1F3] hover:bg-[#2A2A30] transition-colors"
          >
            Maybe Later
          </button>
          <Link
            href="/dashboard/settings"
            className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors"
          >
            Upgrade
          </Link>
        </div>
      </div>
    </div>
  );
}
