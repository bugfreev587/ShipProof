"use client";

import { useAuth } from "@clerk/nextjs";
import AvatarDropdown from "@/components/avatar-dropdown";
import { LogoFull } from "@/components/Logo";

export default function LandingNav() {
  const { isSignedIn } = useAuth();

  return (
    <nav className="sticky top-0 z-40 border-b border-[#2A2A30]/50 bg-[#0F0F10]/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="/">
          <LogoFull size={28} />
        </a>
        <div className="hidden items-center gap-6 text-sm text-[#9CA3AF] md:flex">
          <a href="#features" className="hover:text-[#F1F1F3] transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-[#F1F1F3] transition-colors">
            Pricing
          </a>
          <a href="#faq" className="hover:text-[#F1F1F3] transition-colors">
            FAQ
          </a>
        </div>
        {isSignedIn ? (
          <AvatarDropdown />
        ) : (
          <div className="flex items-center gap-3">
            <a
              href="/sign-in"
              className="text-sm text-[#9CA3AF] hover:text-[#F1F1F3] transition-colors"
            >
              Sign In
            </a>
            <a
              href="/sign-up"
              className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors"
            >
              Get Started Free
            </a>
          </div>
        )}
      </div>
    </nav>
  );
}
