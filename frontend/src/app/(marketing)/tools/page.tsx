import type { Metadata } from "next";
import LandingNav from "@/components/landing-nav";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Free Launch Tools for Indie Hackers | ShipProof",
  description:
    "Free AI-powered tools to help indie hackers launch better — launch copy generator, launch readiness checker, and more. No signup required.",
};

const tools = [
  {
    slug: "launch-copy",
    name: "AI Launch Copy Generator",
    description:
      "Generate platform-specific launch content for Product Hunt, Reddit, Hacker News, Twitter/X, and IndieHackers in minutes.",
    icon: "✦",
    status: "live" as const,
    color: "#6366F1",
  },
  {
    slug: "../launchready",
    name: "LaunchReady",
    description:
      "Score your product's launch readiness across 10 criteria. Get a personalized checklist before you ship.",
    icon: "✓",
    status: "live" as const,
    color: "#059669",
  },
  {
    slug: "ph-grader",
    name: "PH Description Grader",
    description:
      "Paste your Product Hunt description and get an AI-powered score with specific improvement suggestions.",
    icon: "▲",
    status: "coming-soon" as const,
    color: "#FF6154",
  },
  {
    slug: "proof-calculator",
    name: "Social Proof ROI Calculator",
    description:
      "See how adding social proof to your landing page could impact your conversion rate and revenue.",
    icon: "◇",
    status: "coming-soon" as const,
    color: "#D97706",
  },
  {
    slug: "reddit-analyzer",
    name: "Reddit Launch Post Analyzer",
    description:
      "Analyze top-performing Reddit launch posts in your niche and get AI-generated post templates.",
    icon: "●",
    status: "coming-soon" as const,
    color: "#FF4500",
  },
  {
    slug: "hn-checker",
    name: "Show HN Post Checker",
    description:
      "Check if your Show HN post follows Hacker News guidelines and culture. Get tone and format suggestions.",
    icon: "Y",
    status: "coming-soon" as const,
    color: "#FF6600",
  },
];

export default function ToolsHubPage() {
  return (
    <main className="min-h-screen bg-background">
      <LandingNav />

      {/* Hero */}
      <section className="pt-24 pb-16 px-6 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center rounded-full border border-[#059669]/20 bg-[#059669]/10 px-4 py-1.5 text-sm text-[#059669] mb-6">
            100% Free — No signup required
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
            Free launch tools for indie hackers
          </h1>
          <p className="mt-4 text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto">
            Everything you need to launch your product across every platform. Built by ShipProof.
          </p>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="pb-20 px-6">
        <div className="mx-auto max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-4">
          {tools.map((tool) => {
            const isLive = tool.status === "live";
            const href = tool.slug.startsWith("..") ? "/launchready" : `/tools/${tool.slug}`;

            const card = (
              <div
                className={`rounded-xl border border-border bg-card p-6 transition-all ${
                  isLive ? "hover:border-border/80 hover:shadow-lg hover:shadow-black/5" : "opacity-60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-lg text-lg font-bold"
                    style={{ backgroundColor: `${tool.color}15`, color: tool.color }}
                  >
                    {tool.icon}
                  </div>
                  {isLive && (
                    <span className="text-xs bg-[#059669]/10 text-[#059669] px-2 py-0.5 rounded-full font-medium">
                      Free
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-foreground mt-3">{tool.name}</h3>
                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                  {tool.description}
                </p>
                <div className="mt-4">
                  {isLive ? (
                    <span className="text-sm font-medium text-[#6366F1]">Try it free &rarr;</span>
                  ) : (
                    <span className="text-xs text-muted-foreground/50">Coming soon</span>
                  )}
                </div>
              </div>
            );

            return isLive ? (
              <a key={tool.slug} href={href} className="block">
                {card}
              </a>
            ) : (
              <div key={tool.slug}>{card}</div>
            );
          })}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-20 px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-muted-foreground text-sm leading-relaxed">
            These tools are just the beginning. ShipProof does the full loop:{" "}
            <span className="text-foreground font-medium">Ship → Collect → Display.</span>
          </p>
          <a
            href="/"
            className="inline-block mt-4 text-sm font-medium text-[#6366F1] hover:text-[#818CF8] transition-colors"
          >
            Learn more about ShipProof &rarr;
          </a>
        </div>
      </section>

      <Footer />
    </main>
  );
}
