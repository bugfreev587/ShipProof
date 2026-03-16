"use client";

import Link from "next/link";
import { useTheme } from "@/lib/theme";
import AvatarDropdown from "@/components/avatar-dropdown";
import { LogoFull } from "@/components/Logo";
import { Footer } from "@/components/footer";

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
          <Link href="/dashboard">
            <LogoFull size={28} />
          </Link>
          <AvatarDropdown />
        </div>
      </nav>
      <main className="mx-auto max-w-[1400px] px-10 py-8">{children}</main>
      <Footer />
    </div>
  );
}
