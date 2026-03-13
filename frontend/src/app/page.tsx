import type { Metadata } from "next";
import FlywheelAnimation from "@/components/flywheel-animation";
import PricingCards from "@/components/pricing-cards";
import LandingNav from "@/components/landing-nav";

export const metadata: Metadata = {
  title: "ShipProof — Turn every launch into lasting social proof",
  description:
    "AI-generated launch copy, community praise collection, and embeddable social proof widgets. The flywheel for indie hackers.",
};

const howItWorks = [
  {
    title: "Ship",
    description:
      "Generate platform-ready launch copy for Product Hunt, Reddit, Hacker News, Twitter, and IndieHackers — powered by AI.",
    color: "border-[#6366F1] text-[#6366F1]",
    bg: "bg-[#6366F1]/10",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
  },
  {
    title: "Collect",
    description:
      "Gather testimonials, tweets, and reviews from your community. Organize with tags, feature the best ones.",
    color: "border-[#10B981] text-[#10B981]",
    bg: "bg-[#10B981]/10",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  {
    title: "Display",
    description:
      "Embed a customizable widget on your site or share a beautiful Wall of Love page. Social proof that converts.",
    color: "border-[#F59E0B] text-[#F59E0B]",
    bg: "bg-[#F59E0B]/10",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
      </svg>
    ),
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
    a: "Yes! Choose dark or light theme, adjust border radius, card spacing, max items displayed, and toggle platform icons. Business plan users can also remove ShipProof branding.",
  },
  {
    q: "What is a Wall of Love?",
    a: "A Wall of Love is a standalone page that showcases your best testimonials and social proof. Share the link with potential customers or embed it in your marketing pages.",
  },
  {
    q: "Is there a free plan?",
    a: "Yes! The free plan includes 1 product, 1 proof, 3 AI generations per month, and the embed widget with branding. Upgrade to Pro for unlimited usage.",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0F0F10]">
      {/* Nav */}
      <LandingNav />

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 pt-20 pb-24 md:pt-32">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h1 className="mb-4 text-4xl font-bold leading-tight text-[#F1F1F3] md:text-5xl">
              Turn every launch into lasting{" "}
              <span className="text-[#6366F1]">social proof</span>
            </h1>
            <p className="mb-8 text-lg text-[#9CA3AF]">
              Generate platform-ready launch copy, collect community praise, and
              display it everywhere — all in one place.
            </p>
            <div className="flex gap-4">
              <a
                href="/sign-up"
                className="rounded-lg bg-[#6366F1] px-6 py-3 font-medium text-white hover:bg-[#818CF8] transition-colors"
              >
                Get Started Free
              </a>
              <a
                href="#features"
                className="rounded-lg border border-[#2A2A30] px-6 py-3 font-medium text-[#F1F1F3] hover:bg-[#2A2A30] transition-colors"
              >
                See How It Works
              </a>
            </div>
          </div>
          <div>
            <FlywheelAnimation />
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="features" className="border-t border-[#2A2A30] bg-[#0F0F10] py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-[#F1F1F3]">
            How It Works
          </h2>
          <p className="mb-12 text-center text-[#9CA3AF]">
            Three simple steps. One powerful flywheel.
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {howItWorks.map((step, i) => (
              <div
                key={step.title}
                className={`rounded-xl border ${step.color.split(" ")[0]} bg-[#1A1A1F] p-6`}
              >
                <div
                  className={`mb-4 inline-flex h-10 w-10 items-center justify-center rounded-lg ${step.bg} ${step.color.split(" ")[1]}`}
                >
                  {step.icon}
                </div>
                <div className="mb-1 text-xs font-medium text-[#6B7280]">
                  Step {i + 1}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#F1F1F3]">
                  {step.title}
                </h3>
                <p className="text-sm text-[#9CA3AF]">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof Demo */}
      <section className="border-t border-[#2A2A30] py-20">
        <div className="mx-auto max-w-6xl px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold text-[#F1F1F3]">
            Beautiful social proof, everywhere
          </h2>
          <p className="mb-12 text-[#9CA3AF]">
            Embed a widget on your site or share a Wall of Love page.
          </p>
          <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-8">
            <div className="flex gap-5 overflow-x-auto pb-2" style={{ scrollbarWidth: "thin" }}>
              {[
                {
                  name: "Alex Chen",
                  title: "Founder, LaunchKit",
                  text: "ShipProof saved me hours of writing launch copy. The AI nailed the tone for every platform.",
                },
                {
                  name: "Sarah M.",
                  title: "Indie Hacker",
                  text: "The Wall of Love page is gorgeous. I share it with every potential customer.",
                },
                {
                  name: "Mike R.",
                  title: "Product Manager",
                  text: "Finally, a tool that understands the difference between a Reddit post and a Product Hunt description.",
                },
              ].map((t) => (
                <div
                  key={t.name}
                  className="flex-shrink-0 rounded-xl border border-[#2A2A30] bg-[#0F0F10] p-6 text-left"
                  style={{ width: "340px" }}
                >
                  <p className="mb-4 text-base leading-relaxed text-[#F1F1F3]">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="text-sm text-[#9CA3AF]">
                    <span className="font-medium text-[#F1F1F3]">{t.name}</span>
                    {" — "}
                    {t.title}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-[#6B7280]">
              Powered by ShipProof
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-t border-[#2A2A30] py-20">
        <div className="mx-auto max-w-4xl px-4">
          <h2 className="mb-4 text-center text-3xl font-bold text-[#F1F1F3]">
            Simple, transparent pricing
          </h2>
          <p className="mb-12 text-center text-[#9CA3AF]">
            Start free. Upgrade when you need more.
          </p>
          <PricingCards />
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-[#2A2A30] py-20">
        <div className="mx-auto max-w-3xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold text-[#F1F1F3]">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl border border-[#2A2A30] bg-[#1A1A1F]"
              >
                <summary className="flex cursor-pointer items-center justify-between p-4 text-sm font-medium text-[#F1F1F3] [&::-webkit-details-marker]:hidden">
                  {faq.q}
                  <svg
                    className="h-4 w-4 shrink-0 text-[#9CA3AF] transition-transform group-open:rotate-180"
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
                <div className="border-t border-[#2A2A30] px-4 py-3 text-sm text-[#9CA3AF]">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2A2A30] py-8">
        <div className="mx-auto max-w-6xl px-4 flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-sm text-[#6B7280]">
            &copy; 2026 ShipProof. Turn every launch into lasting social proof.
          </div>
          <div className="flex gap-6 text-sm text-[#6B7280]">
            <a href="#features" className="hover:text-[#F1F1F3] transition-colors">
              Features
            </a>
            <a href="/pricing" className="hover:text-[#F1F1F3] transition-colors">
              Pricing
            </a>
            <a href="#faq" className="hover:text-[#F1F1F3] transition-colors">
              FAQ
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
