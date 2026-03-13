"use client";

import Link from "next/link";
import { useUser, useClerk } from "@clerk/nextjs";
import { useState, useRef, useEffect } from "react";

function AvatarDropdown() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials =
    (user?.firstName?.[0] || "") + (user?.lastName?.[0] || "") ||
    user?.primaryEmailAddress?.emailAddress?.[0]?.toUpperCase() ||
    "?";

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-[#6366F1] text-xs font-semibold text-white hover:bg-[#818CF8] transition-colors"
      >
        {user?.imageUrl ? (
          <img
            src={user.imageUrl}
            alt=""
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          initials
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl border border-[#2A2A30] bg-[#1A1A1F] py-1 shadow-lg z-50">
          <Link
            href="/dashboard"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-[#F1F1F3] hover:bg-[#242429] transition-colors"
          >
            Dashboard
          </Link>
          <Link
            href="/pricing"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-[#F1F1F3] hover:bg-[#242429] transition-colors"
          >
            Upgrade
          </Link>
          <Link
            href="/dashboard/settings"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-sm text-[#F1F1F3] hover:bg-[#242429] transition-colors"
          >
            Settings
          </Link>
          <div className="my-1 border-t border-[#2A2A30]" />
          <button
            onClick={() => signOut({ redirectUrl: "/" })}
            className="block w-full px-4 py-2 text-left text-sm text-[#9CA3AF] hover:bg-[#242429] hover:text-[#F1F1F3] transition-colors"
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

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
