import type { Metadata } from "next";
import PricingCards from "@/components/pricing-cards";

export const metadata: Metadata = {
  title: "Pricing — ShipProof",
  description:
    "Choose the right plan for your launch content and social proof needs. Free, Pro, and Business plans available.",
};

const faqs = [
  {
    q: "Can I switch plans at any time?",
    a: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged the prorated difference. When downgrading, the change takes effect at the end of your current billing cycle.",
  },
  {
    q: "What happens if I exceed my Free plan limits?",
    a: "You'll see a friendly prompt to upgrade. Your existing data is never deleted — you just won't be able to create new items beyond the limit until you upgrade.",
  },
  {
    q: "Is there a free trial for Pro or Business?",
    a: "We don't offer a traditional free trial, but the Free plan lets you explore all core features. You can upgrade when you're ready to unlock unlimited usage.",
  },
  {
    q: "What payment methods do you accept?",
    a: "We accept all major credit cards through Stripe, including Visa, Mastercard, and American Express. All payments are securely processed.",
  },
  {
    q: "Can I cancel anytime?",
    a: "Absolutely. There are no contracts or cancellation fees. Cancel from your billing settings and you'll retain access until the end of your paid period.",
  },
  {
    q: "What does 'remove branding' mean?",
    a: "By default, the embed widget and Wall of Love pages show a small 'Powered by ShipProof' badge. Business plan users can hide this badge for a fully white-label experience.",
  },
];

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#0F0F10]">
      {/* Header */}
      <div className="mx-auto max-w-6xl px-4 pt-24 pb-16 text-center">
        <h1 className="mb-4 text-4xl font-bold text-[#F1F1F3]">
          Simple, transparent pricing
        </h1>
        <p className="text-lg text-[#9CA3AF]">
          Start free. Upgrade when you need more.
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="mx-auto max-w-4xl px-4 pb-20">
        <PricingCards />
      </div>

      {/* FAQ */}
      <div className="mx-auto max-w-3xl px-4 pb-24">
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
    </div>
  );
}
