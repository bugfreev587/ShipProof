"use client";

import { useAuth } from "@clerk/nextjs";
import AvatarDropdown from "@/components/avatar-dropdown";
import { LogoFull } from "@/components/Logo";
import ThemeToggle from "@/components/theme-toggle";

export default function LandingNav() {
  const { isSignedIn } = useAuth();

  return (
    <nav className="sticky top-0 z-40 border-b border-[var(--landing-panel-border)] bg-[var(--landing-bg-a)]/80 backdrop-blur-md">
      <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between px-6">
        <a href="/">
          <LogoFull size={32} />
        </a>
        <div className="hidden items-center gap-8 text-base text-muted-foreground md:flex">
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            Pricing
          </a>
          <a href="#faq" className="hover:text-foreground transition-colors">
            FAQ
          </a>
          <a href="/launchready" className="hover:text-foreground transition-colors flex items-center">
            LaunchReady
            <span className="text-[10px] bg-[#22C55E]/10 text-[#22C55E] rounded-full px-1.5 py-0.5 ml-1.5">Free</span>
          </a>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {isSignedIn ? (
            <AvatarDropdown />
          ) : (
            <>
              <a
                href="/sign-in"
                className="text-base text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </a>
              <a
                href="/sign-up"
                className="rounded-lg bg-[#6366F1] px-5 py-2.5 text-base font-medium text-white hover:bg-[#818CF8] transition-colors"
              >
                Get Started
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
