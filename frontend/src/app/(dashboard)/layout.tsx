import Link from "next/link";
import AvatarDropdown from "@/components/avatar-dropdown";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0F0F10]">
      <nav className="sticky top-0 z-50 border-b border-[#2A2A30] bg-[#0F0F10]">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/dashboard" className="text-lg font-bold text-[#F1F1F3]">
            <span>Ship</span>
            <span className="text-[#6366F1]">Proof</span>
          </Link>
          <AvatarDropdown />
        </div>
      </nav>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
