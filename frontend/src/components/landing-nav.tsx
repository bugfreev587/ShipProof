"use client";

import { useAuth } from "@clerk/nextjs";
import AvatarDropdown from "@/components/avatar-dropdown";
import { LogoFull } from "@/components/Logo";
import ThemeToggle from "@/components/theme-toggle";

export default function LandingNav() {
  const { isSignedIn } = useAuth();

  return (
    <nav className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <a href="/">
          <LogoFull size={28} />
        </a>
        <div className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
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
            <span className="text-[10px] bg-[#22C55E]/10 text-[#22C55E] rounded-full px-1.5 py-0.5 ml-1">Free</span>
          </a>
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          {isSignedIn ? (
            <AvatarDropdown />
          ) : (
            <>
              <a
                href="/sign-in"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </a>
              <a
                href="/sign-up"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/80 transition-colors"
              >
                Get Started Free
              </a>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
