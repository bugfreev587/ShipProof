import type { Metadata } from "next";
import LandingNav from "@/components/landing-nav";
import { Footer } from "@/components/footer";
import { LaunchCopyGenerator } from "@/components/tools/launch-copy-generator";

export const metadata: Metadata = {
  title: "AI Launch Copy Generator — Free Tool | ShipProof",
  description:
    "Generate platform-specific launch content for Product Hunt, Reddit, Hacker News, Twitter/X, and IndieHackers. Free, no signup required. Powered by AI.",
  openGraph: {
    title: "AI Launch Copy Generator — Free Tool",
    description:
      "Generate launch content for 5 platforms in 2 minutes. Free, no signup.",
  },
};

export default function LaunchCopyPage() {
  return (
    <main className="min-h-screen bg-background">
      <LandingNav />
      <LaunchCopyGenerator />
      <Footer />
    </main>
  );
}
