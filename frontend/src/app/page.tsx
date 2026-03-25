import type { Metadata } from "next";
import PricingCards from "@/components/pricing-cards";
import LandingNav from "@/components/landing-nav";
import EmbedCodeBlock from "@/components/embed-code-block";
import { Footer } from "@/components/footer";
import { ScrollFadeIn } from "@/components/scroll-fade-in";

export const metadata: Metadata = {
  title: "ShipProof — Turn every launch into lasting social proof",
  description:
    "AI-generated launch copy, community praise collection, and embeddable social proof widgets. The flywheel for indie hackers.",
};

/* ─── Data ─── */

const painPoints = [
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "5 platforms, 5 different writing styles",
    description: "Each platform has its own culture. Writing for all of them takes hours — time you'd rather spend building.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25-2.25M12 13.875V7.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Great feedback buried in comment threads",
    description: "Someone praised your product on Twitter. You screenshot it. Then lose the file. Repeat for every platform.",
  },
  {
    icon: (
      <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
      </svg>
    ),
    title: "No social proof on your landing page",
    description: "Visitors leave because there's no proof anyone else uses your product. You know it's great — but they don't.",
  },
];

const howItWorks = [
  {
    step: "01",
    title: "Ship",
    description: "Generate platform-ready launch copy for Product Hunt, Reddit, Hacker News, Twitter/X, and IndieHackers — powered by AI.",
    quote: "One click. Five platforms. All the copy you need.",
    color: "#6366F1",
  },
  {
    step: "02",
    title: "Collect",
    description: "Gather testimonials, tweets, and reviews. Paste a URL, capture a screenshot, or use our Chrome Extension.",
    quote: "Never lose a great comment again.",
    color: "#F59E0B",
  },
  {
    step: "03",
    title: "Display",
    description: "Embed a widget on your site or share a Wall of Love page. Auto-scrolling marquee or carousel — your pick.",
    quote: "Social proof that converts visitors into customers.",
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
    a: "Yes! The free plan includes 1 product, 5 proofs, 3 AI generations per month, Wall of Love page, and the embed widget — everything you need to experience the full Ship → Collect → Display flow. Upgrade to Pro for unlimited proofs and generations.",
  },
];

/* ─── Page ─── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <LandingNav />
      <HeroSection />
      <TrustBar />
      <PainPointSection />
      <HowItWorksSection />
      <SocialProofSection />
      <EmbedDemoSection />
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
    <section className="pt-32 md:pt-40 pb-24 px-6">
      <div className="mx-auto max-w-4xl text-center">
        {/* Overline */}
        <p className="text-[13px] font-medium tracking-[0.5px] uppercase text-[#818CF8] mb-6">
          Launch Content + Social Proof
        </p>

        <h1 className="text-[40px] md:text-[64px] font-bold tracking-[-1.5px] leading-[1.1] text-foreground">
          Turn every launch into{" "}
          <br className="hidden md:block" />
          lasting social proof
        </h1>

        <p className="mt-6 text-lg text-[#9CA3AF] leading-relaxed max-w-2xl mx-auto">
          Generate platform-ready launch copy with AI. Collect community praise.
          Display it everywhere. All in one place.
        </p>

        {/* CTAs */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="/sign-up"
            className="rounded-xl bg-[#6366F1] px-8 py-4 text-base font-semibold text-white hover:bg-[#818CF8] transition-colors"
          >
            Get Started Free &rarr;
          </a>
          <a
            href="#how-it-works"
            className="rounded-xl border border-white/10 px-8 py-4 text-base font-semibold text-foreground hover:bg-white/5 transition-colors"
          >
            See How It Works
          </a>
        </div>

        {/* Product screenshot placeholder */}
        <div className="mt-16 mx-auto max-w-5xl relative">
          <div className="rounded-2xl border border-white/10 bg-[#141418] overflow-hidden shadow-2xl shadow-black/40">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5">
              <span className="h-3 w-3 rounded-full bg-[#FF5F56]" />
              <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
              <span className="h-3 w-3 rounded-full bg-[#27C93F]" />
              <span className="ml-4 flex-1 rounded-md bg-white/5 h-5" />
            </div>
            <div className="aspect-[16/9] flex items-center justify-center">
              <span className="text-[#55555C] text-sm">Dashboard screenshot coming soon</span>
            </div>
          </div>
          {/* Fade out at bottom */}
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-background pointer-events-none" />
        </div>
      </div>
    </section>
  );
}

/* ─── Trust Bar ─── */

function TrustBar() {
  return (
    <ScrollFadeIn>
      <section className="pb-24 px-6">
        <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] text-[#6B7280]">
          <span>
            Built with{" "}
            <span className="text-[#9CA3AF] font-medium">Claude Code</span>
          </span>
          <span className="text-[#3F3F46]">&middot;</span>
          <span>
            Powered by{" "}
            <span className="text-[#9CA3AF] font-medium">Anthropic</span>
          </span>
          <span className="text-[#3F3F46]">&middot;</span>
          <span>
            <span className="text-[#9CA3AF] font-medium">2+</span> products launched
          </span>
        </div>
      </section>
    </ScrollFadeIn>
  );
}

/* ─── Pain Point ─── */

function PainPointSection() {
  return (
    <ScrollFadeIn>
      <section className="py-28 md:py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-[13px] font-medium tracking-[0.5px] uppercase text-[#818CF8] mb-4">
              The Problem
            </p>
            <h2 className="text-[32px] md:text-[40px] font-semibold tracking-[-0.8px] leading-[1.2] text-foreground">
              Launching is the hardest part of building
            </h2>
            <p className="mt-4 text-lg text-[#9CA3AF] leading-relaxed max-w-[600px] mx-auto">
              You built something great. Now you need to tell the world.
              But writing launch posts for 5 platforms, collecting feedback, and displaying social proof? That&apos;s a full-time job.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {painPoints.map((point) => (
              <div
                key={point.title}
                className="rounded-2xl border border-[#1E1E24] bg-[#141418] p-8"
              >
                <div className="mb-5 text-[#9CA3AF]">
                  {point.icon}
                </div>
                <h3 className="text-lg font-medium text-foreground mb-3">
                  {point.title}
                </h3>
                <p className="text-sm text-[#9CA3AF] leading-[1.7]">
                  {point.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </ScrollFadeIn>
  );
}

/* ─── How It Works ─── */

function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-28 md:py-32 px-6">
      <div className="mx-auto max-w-6xl">
        <ScrollFadeIn>
          <div className="text-center mb-20">
            <p className="text-[13px] font-medium tracking-[0.5px] uppercase text-[#818CF8] mb-4">
              How It Works
            </p>
            <h2 className="text-[32px] md:text-[40px] font-semibold tracking-[-0.8px] leading-[1.2] text-foreground">
              Three steps. One flywheel.
            </h2>
            <p className="mt-4 text-lg text-[#9CA3AF] leading-relaxed max-w-[600px] mx-auto">
              Each cycle makes your next launch stronger.
            </p>
          </div>
        </ScrollFadeIn>

        <div className="space-y-24 md:space-y-32">
          {howItWorks.map((item, i) => (
            <ScrollFadeIn key={item.step}>
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-16 items-center ${i % 2 === 1 ? "md:direction-rtl" : ""}`}>
                {/* Text */}
                <div className={i % 2 === 1 ? "md:order-2 md:text-left" : ""} style={{ direction: "ltr" }}>
                  <span
                    className="text-sm font-mono font-medium mb-3 block"
                    style={{ color: item.color }}
                  >
                    {item.step}
                  </span>
                  <h3 className="text-[28px] md:text-[32px] font-semibold text-foreground mb-4">
                    {item.title}
                  </h3>
                  <p className="text-base text-[#D1D5DB] leading-[1.7] mb-6">
                    {item.description}
                  </p>
                  <p className="text-sm italic text-[#818CF8]">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                </div>

                {/* Screenshot placeholder */}
                <div className={i % 2 === 1 ? "md:order-1" : ""} style={{ direction: "ltr" }}>
                  <div
                    className="rounded-2xl border border-white/10 bg-[#141418] aspect-[4/3] flex items-center justify-center"
                  >
                    <span className="text-[#55555C] text-sm">Screenshot coming soon</span>
                  </div>
                </div>
              </div>
            </ScrollFadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Social Proof ─── */

function SocialProofSection() {
  return (
    <ScrollFadeIn>
      <section id="features" className="py-28 md:py-32">
        <div className="mx-auto max-w-6xl px-6 text-center mb-16">
          <p className="text-[13px] font-medium tracking-[0.5px] uppercase text-[#818CF8] mb-4">
            Social Proof
          </p>
          <h2 className="text-[32px] md:text-[40px] font-semibold tracking-[-0.8px] leading-[1.2] text-foreground">
            Loved by indie hackers
          </h2>
          <p className="mt-4 text-lg text-[#9CA3AF] leading-relaxed max-w-[600px] mx-auto">
            See what builders are saying about ShipProof.
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
    </ScrollFadeIn>
  );
}

/* ─── Embed Demo ─── */

function EmbedDemoSection() {
  return (
    <ScrollFadeIn>
      <section className="py-28 md:py-32 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="text-[13px] font-medium tracking-[0.5px] uppercase text-[#818CF8] mb-4">
              Embed in Seconds
            </p>
            <h2 className="text-[32px] md:text-[40px] font-semibold tracking-[-0.8px] leading-[1.2] text-foreground">
              Add to your website in two lines of code
            </h2>
            <p className="mt-4 text-lg text-[#9CA3AF] leading-relaxed max-w-[600px] mx-auto">
              Works with HTML, WordPress, Webflow, Framer — anywhere.
            </p>
          </div>

          <div className="mx-auto max-w-3xl">
            <EmbedCodeBlock />
          </div>
        </div>
      </section>
    </ScrollFadeIn>
  );
}

/* ─── Pricing ─── */

function PricingSection() {
  return (
    <ScrollFadeIn>
      <section id="pricing" className="py-28 md:py-32 px-6">
        <div className="mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <p className="text-[13px] font-medium tracking-[0.5px] uppercase text-[#818CF8] mb-4">
              Pricing
            </p>
            <h2 className="text-[32px] md:text-[40px] font-semibold tracking-[-0.8px] leading-[1.2] text-foreground">
              Ship fast, prove it, grow
            </h2>
            <p className="mt-4 text-lg text-[#9CA3AF] leading-relaxed max-w-[600px] mx-auto">
              Start free. Upgrade when you need more.
            </p>
          </div>
          <PricingCards />
        </div>
      </section>
    </ScrollFadeIn>
  );
}

/* ─── FAQ ─── */

function FAQSection() {
  return (
    <ScrollFadeIn>
      <section id="faq" className="py-28 md:py-32 px-6">
        <div className="mx-auto max-w-3xl">
          <div className="text-center mb-12">
            <p className="text-[13px] font-medium tracking-[0.5px] uppercase text-[#818CF8] mb-4">
              FAQ
            </p>
            <h2 className="text-[32px] md:text-[40px] font-semibold tracking-[-0.8px] leading-[1.2] text-foreground">
              Frequently asked questions
            </h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-border bg-card"
              >
                <summary className="flex cursor-pointer items-center justify-between p-5 text-base font-medium text-foreground [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <svg
                    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="border-t border-border px-5 py-4 text-base text-[#D1D5DB] leading-[1.7]">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
    </ScrollFadeIn>
  );
}

/* ─── Final CTA ─── */

function FinalCTA() {
  return (
    <ScrollFadeIn>
      <section className="border-y border-white/5 bg-gradient-to-br from-[#6366F1]/10 to-[#8B5CF6]/5 py-24 md:py-28 px-6">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-[28px] md:text-[36px] font-semibold tracking-[-0.8px] text-foreground">
            Ready to ship your next launch?
          </h2>
          <p className="mt-4 text-base text-[#D1D5DB] leading-relaxed">
            Join indie hackers who are turning launches into lasting social proof.
          </p>
          <div className="mt-10">
            <a
              href="/sign-up"
              className="inline-block rounded-xl bg-white text-[#0F0F10] px-8 py-4 text-base font-semibold hover:bg-white/90 transition-colors"
            >
              Get Started Free &rarr;
            </a>
          </div>
          <p className="mt-6 text-[13px] text-[#6B7280]">
            Free forever plan &bull; No credit card required &bull; Setup in 2 minutes
          </p>
        </div>
      </section>
    </ScrollFadeIn>
  );
}
