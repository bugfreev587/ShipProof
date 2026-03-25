import type { Metadata } from "next";
import PricingCards from "@/components/pricing-cards";
import LandingNav from "@/components/landing-nav";
import EmbedCodeBlock from "@/components/embed-code-block";
import { Footer } from "@/components/footer";
import WallOfLove from "@/components/WallOfLove";

export const metadata: Metadata = {
  title: "ShipProof — Turn every launch into lasting social proof",
  description:
    "AI-generated launch copy, community praise collection, and embeddable social proof widgets. The flywheel for indie hackers.",
};

/* ─── Data ─── */

const timelineSteps = [
  {
    label: "Day 1",
    title: "Generate launch content in minutes, not hours",
    description:
      "Enter your product details. ShipProof generates platform-ready copy for Product Hunt, Reddit, Hacker News, Twitter/X, and IndieHackers.",
    highlight: "What used to take a full Sunday now takes 2 minutes.",
    tags: [
      "Product Hunt description",
      "Reddit posts",
      "HN Show post",
      "Twitter/X thread",
      "IndieHackers post",
    ],
    color: "#6366F1",
  },
  {
    label: "Week 1",
    title: "Collect praise automatically as it happens",
    description:
      "Paste a tweet URL, a PH comment link, or a Reddit reply — ShipProof pulls in the content, attributes the source, and tags it.",
    highlight: "No more screenshotting and cropping. Paste URL, done.",
    tags: [
      "One-click import",
      "Auto source badge",
      "Tag & organize",
      "Collection link",
    ],
    color: "#F59E0B",
  },
  {
    label: "Week 2",
    title: "Display social proof that actually converts",
    description:
      "Embed a beautiful Wall of Proof on your landing page — masonry grid or carousel. New visitors see real user feedback with source badges and verified tags.",
    highlight: "Two lines of code. No build tools. Works everywhere.",
    tags: [
      "Embeddable widget",
      "Wall of Proof page",
      "Light/dark theme",
      "Platform filter",
      "AI summary card",
    ],
    color: "#3B82F6",
  },
];

const faqs = [
  {
    q: "What platforms does ShipProof support?",
    a: "ShipProof generates launch content for Product Hunt, Reddit (multiple subreddits), Hacker News, Twitter/X, and IndieHackers. Each platform's content follows its specific culture and best practices.",
  },
  {
    q: "How does the AI content generation work?",
    a: "Enter your product details and select your target platforms. Our AI generates platform-specific launch copy — Product Hunt descriptions, Reddit posts, HN comments, Twitter threads, and more — all tailored to each platform's audience.",
  },
  {
    q: "Can I customize the embed widget?",
    a: 'Yes! Choose dark or light theme, adjust border radius, card spacing, max items displayed, and toggle platform icons. Business plan users can remove the "Powered by ShipProof" badge.',
  },
  {
    q: "What is a Wall of Love?",
    a: "A Wall of Love is a standalone page that showcases your best testimonials and social proof. Share the link with potential customers or embed it in your marketing pages.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! The free plan includes 1 product, 5 proofs, 3 AI generations per month, Wall of Love page, and the embed widget — everything you need to experience the full Ship \u2192 Collect \u2192 Display flow. Upgrade to Pro for unlimited proofs and generations.",
  },
];

/* ─── Page ─── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <FlywheelVisual />
      <TimelineSection />
      <SocialProofSection />
      <EmbedDemoSection />
      <WallOfLove />
      <PricingSection />
      <FAQSection />
      <FinalCTA />
      <Footer />
    </div>
  );
}

/* ─── Hero ─── */

function HeroSection() {
  return (
    <section className="py-24 px-6">
      <div className="mx-auto max-w-3xl text-center">
        {/* Pill badge */}
        <div className="mb-6 inline-flex items-center rounded-full border border-border bg-card px-4 py-1.5 text-sm text-muted-foreground">
          For indie hackers &amp; solo founders
        </div>

        <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground">
          Launch with{" "}
          <span className="bg-gradient-to-r from-indigo-500 to-pink-500 bg-clip-text text-transparent">
            confidence
          </span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-muted-foreground leading-relaxed">
          The all-in-one launch toolkit for indie hackers — from first post to
          social proof.
        </p>

        <p className="mt-3 text-base text-muted-foreground/80">
          Generate launch content. Collect real user praise. Display it
          everywhere.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/sign-up"
            className="rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Get Started Free &rarr;
          </a>
          <a
            href="#timeline"
            className="rounded-lg border border-border px-8 py-3.5 text-sm font-semibold text-foreground hover:bg-muted transition-colors"
          >
            See how it works
          </a>
        </div>

        {/* Trust signals */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Free plan available
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            No credit card required
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            2 min setup
          </span>
        </div>
      </div>
    </section>
  );
}

/* ─── Flywheel Visual ─── */

function FlywheelVisual() {
  const steps = [
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      label: "Ship",
      sublabel: "AI launch copy",
      color: "#6366F1",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      ),
      label: "Collect",
      sublabel: "Gather praise",
      color: "#F59E0B",
    },
    {
      icon: (
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
        </svg>
      ),
      label: "Display",
      sublabel: "Widget & Wall",
      color: "#3B82F6",
    },
  ];

  return (
    <section className="py-12 px-6">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-center gap-4">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-4">
              <div className="flex flex-col items-center text-center">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${step.color}15`,
                    color: step.color,
                  }}
                >
                  {step.icon}
                </div>
                <span className="mt-2 text-sm font-semibold text-foreground">
                  {step.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {step.sublabel}
                </span>
              </div>
              {i < steps.length - 1 && (
                <svg
                  className="h-5 w-5 text-muted-foreground/40 flex-shrink-0 -mt-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-sm italic text-muted-foreground">
          Each cycle makes your next launch stronger &#8635;
        </p>
      </div>
    </section>
  );
}

/* ─── Timeline ─── */

function TimelineSection() {
  return (
    <section id="timeline" className="py-20 px-6">
      <div className="mx-auto max-w-3xl">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground text-center mb-4">
          How it works
        </h2>
        <p className="text-center text-muted-foreground mb-16">
          From launch to social proof in three steps.
        </p>

        <div className="relative">
          {/* Vertical line */}
          <div
            className="absolute left-5 top-0 bottom-0 w-px hidden md:block"
            style={{
              background:
                "linear-gradient(to bottom, #6366F1, #F59E0B, #3B82F6)",
            }}
          />

          <div className="space-y-16">
            {timelineSteps.map((step) => (
              <div key={step.label} className="relative md:pl-16">
                {/* Icon dot */}
                <div
                  className="hidden md:flex absolute left-0 top-0 h-10 w-10 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: `${step.color}15`,
                    border: `2px solid ${step.color}`,
                  }}
                >
                  <span
                    className="text-xs font-bold"
                    style={{ color: step.color }}
                  >
                    {step.label.replace("Day ", "D").replace("Week ", "W")}
                  </span>
                </div>

                {/* Content */}
                <div>
                  <span
                    className="inline-block text-xs font-semibold uppercase tracking-wider mb-2"
                    style={{ color: step.color }}
                  >
                    {step.label}
                  </span>
                  <h3 className="text-xl font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  <p className="text-muted-foreground leading-7 mb-3">
                    {step.description}
                  </p>
                  <p
                    className="text-sm font-medium mb-4"
                    style={{ color: step.color }}
                  >
                    &ldquo;{step.highlight}&rdquo;
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {step.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Social Proof Demo ─── */

function SocialProofSection() {
  return (
    <section id="features" className="border-t border-border py-20">
      <div className="mx-auto max-w-6xl px-4 text-center">
        <h2 className="mb-4 text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Beautiful social proof, everywhere
        </h2>
        <p className="mb-12 text-muted-foreground">
          Embed a widget on your site or share a Wall of Love page.
        </p>
      </div>
      <div className="w-full overflow-hidden">
        <iframe
          id="shipproof-landing-page-space-afa275"
          src="https://shipproof.io/embed/landing-page-space-afa275"
          frameBorder="0"
          scrolling="no"
          width="100%"
          style={{ border: "none", minHeight: "400px" }}
          loading="lazy"
        />
        <script
          type="text/javascript"
          src="https://shipproof.io/js/embed.js"
          async
        />
      </div>
    </section>
  );
}

/* ─── Embed Demo ─── */

function EmbedDemoSection() {
  return (
    <section className="border-t border-border py-20">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="mb-4 text-center text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Add to your website in seconds
        </h2>
        <p className="mb-12 text-center text-muted-foreground">
          Two lines of code. No build tools. Works everywhere.
        </p>

        <div className="grid gap-8 md:grid-cols-3 mb-10">
          {[
            {
              num: "1",
              color: "#6366F1",
              title: "Copy the snippet",
              desc: "Grab the embed code from your space settings",
            },
            {
              num: "2",
              color: "#10B981",
              title: "Paste into your site",
              desc: "HTML, WordPress, Webflow, Framer — anywhere",
            },
            {
              num: "3",
              color: "#F59E0B",
              title: "Done",
              desc: "Auto-resizing widget, no extra setup needed",
            },
          ].map((step) => (
            <div key={step.num} className="text-center">
              <div
                className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${step.color}15` }}
              >
                <span
                  className="text-lg font-bold"
                  style={{ color: step.color }}
                >
                  {step.num}
                </span>
              </div>
              <h3 className="mb-1 text-sm font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="text-xs text-muted-foreground">{step.desc}</p>
            </div>
          ))}
        </div>

        <EmbedCodeBlock />
      </div>
    </section>
  );
}

/* ─── Pricing ─── */

function PricingSection() {
  return (
    <section id="pricing" className="border-t border-border py-20">
      <div className="mx-auto max-w-4xl px-6">
        <h2 className="mb-4 text-center text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Ship fast, prove it, grow
        </h2>
        <p className="mb-12 text-center text-muted-foreground">
          Start free. Upgrade when you need more.
        </p>
        <PricingCards />
      </div>
    </section>
  );
}

/* ─── FAQ ─── */

function FAQSection() {
  return (
    <section id="faq" className="border-t border-border py-20">
      <div className="mx-auto max-w-3xl px-6">
        <h2 className="mb-8 text-center text-2xl font-extrabold tracking-tight text-foreground">
          Frequently Asked Questions
        </h2>
        <div className="space-y-4">
          {faqs.map((faq) => (
            <details
              key={faq.q}
              className="group rounded-xl border border-border bg-card"
            >
              <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                {faq.q}
                <svg
                  className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </summary>
              <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
                {faq.a}
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Final CTA ─── */

function FinalCTA() {
  return (
    <section className="border-t border-border py-24 px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
          Your next launch deserves social proof
        </h2>
        <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
          Stop losing conversions because visitors can&apos;t see what your users
          think.
        </p>
        <div className="mt-10">
          <a
            href="/sign-up"
            className="rounded-lg bg-primary px-8 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/80 transition-colors"
          >
            Get Started Free &rarr;
          </a>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Free forever plan &bull; No credit card required &bull; Setup in 2
          minutes
        </p>
      </div>
    </section>
  );
}
