"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme";
import AvatarDropdown from "@/components/avatar-dropdown";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <div className="min-h-screen" style={{ background: colors.bgBase }}>
      <nav
        className="sticky top-0 z-50"
        style={{
          borderBottom: `1px solid ${colors.border}`,
          background: colors.bgBase,
        }}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-10">
          <Link href="/dashboard" className="text-xl font-bold" style={{ color: colors.textPrimary }}>
            <span>Ship</span>
            <span className="text-[#6366F1]">Proof</span>
          </Link>
          <AvatarDropdown />
        </div>
      </nav>
      <main className="mx-auto max-w-[1400px] px-10 py-8">{children}</main>
    </div>
  );
}
