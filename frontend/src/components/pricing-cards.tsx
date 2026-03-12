"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { createCheckoutSession } from "@/lib/api";

const plans = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    badge: null,
    borderColor: "border-[#2A2A30]",
    badgeColor: "",
    features: [
      { text: "1 product", included: true },
      { text: "1 proof per product", included: true },
      { text: "3 AI generations / month", included: true },
      { text: "3 saved versions", included: true },
      { text: "Embed widget (with branding)", included: true },
      { text: "Wall of Love pages", included: false },
      { text: "Remove branding", included: false },
    ],
    ctaText: "Get Started Free",
    ctaLink: "/sign-up",
    plan: "free",
  },
  {
    name: "Pro",
    monthlyPrice: 12,
    yearlyPrice: 9,
    badge: "Most Popular",
    borderColor: "border-[#6366F1]",
    badgeColor: "bg-[#6366F1]",
    features: [
      { text: "1 product", included: true },
      { text: "Unlimited proofs", included: true },
      { text: "Unlimited AI generations", included: true },
      { text: "Unlimited versions", included: true },
      { text: "Embed widget (with branding)", included: true },
      { text: "Wall of Love pages", included: true },
      { text: "Remove branding", included: false },
    ],
    ctaText: "Start Pro",
    plan: "pro",
  },
  {
    name: "Business",
    monthlyPrice: 29,
    yearlyPrice: 24,
    badge: null,
    borderColor: "border-[#2A2A30]",
    badgeColor: "",
    features: [
      { text: "10 products", included: true },
      { text: "Unlimited proofs", included: true },
      { text: "Unlimited AI generations", included: true },
      { text: "Unlimited versions", included: true },
      { text: "Embed widget", included: true },
      { text: "Wall of Love pages", included: true },
      { text: "Remove branding", included: true },
    ],
    ctaText: "Start Business",
    plan: "business",
  },
];

const priceIds: Record<string, { monthly: string; yearly: string }> = {
  pro: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID || "",
    yearly: process.env.NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID || "",
  },
  business: {
    monthly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_MONTHLY_PRICE_ID || "",
    yearly: process.env.NEXT_PUBLIC_STRIPE_BUSINESS_YEARLY_PRICE_ID || "",
  },
};

export default function PricingCards() {
  const [yearly, setYearly] = useState(false);
  const { isSignedIn, getToken } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (plan: string) => {
    if (!isSignedIn) {
      window.location.href = "/sign-up";
      return;
    }
    setLoading(plan);
    try {
      const token = await getToken();
      if (!token) return;
      const period = yearly ? "yearly" : "monthly";
      const priceId = priceIds[plan]?.[period];
      if (!priceId) return;
      const { url } = await createCheckoutSession(
        { price_id: priceId, plan },
        token,
      );
      window.location.href = url;
    } catch {
      // handle error
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      {/* Toggle */}
      <div className="mb-8 flex items-center justify-center gap-3">
        <span
          className={`text-sm ${!yearly ? "text-[#F1F1F3]" : "text-[#9CA3AF]"}`}
        >
          Monthly
        </span>
        <button
          onClick={() => setYearly(!yearly)}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            yearly ? "bg-[#6366F1]" : "bg-[#3F3F46]"
          }`}
        >
          <span
            className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
              yearly ? "translate-x-5" : ""
            }`}
          />
        </button>
        <span
          className={`text-sm ${yearly ? "text-[#F1F1F3]" : "text-[#9CA3AF]"}`}
        >
          Yearly{" "}
          <span className="text-[#10B981] text-xs font-medium">Save 25%</span>
        </span>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-xl border ${plan.borderColor} bg-[#1A1A1F] p-6`}
          >
            {plan.badge && (
              <div
                className={`absolute -top-3 left-1/2 -translate-x-1/2 rounded-full ${plan.badgeColor} px-3 py-0.5 text-xs font-medium text-white`}
              >
                {plan.badge}
              </div>
            )}

            <h3 className="text-lg font-semibold text-[#F1F1F3]">
              {plan.name}
            </h3>
            <div className="mt-2 mb-4">
              <span className="text-3xl font-bold text-[#F1F1F3]">
                ${yearly ? plan.yearlyPrice : plan.monthlyPrice}
              </span>
              {plan.monthlyPrice > 0 && (
                <span className="text-[#9CA3AF] text-sm">/mo</span>
              )}
            </div>

            <ul className="mb-6 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature.text} className="flex items-center gap-2 text-sm">
                  {feature.included ? (
                    <svg
                      className="h-4 w-4 shrink-0 text-[#10B981]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-4 w-4 shrink-0 text-[#6B7280]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  )}
                  <span
                    className={
                      feature.included ? "text-[#F1F1F3]" : "text-[#6B7280]"
                    }
                  >
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            {plan.plan === "free" ? (
              <a
                href={plan.ctaLink}
                className="block w-full rounded-lg border border-[#2A2A30] px-4 py-2 text-center text-sm font-medium text-[#F1F1F3] hover:bg-[#2A2A30] transition-colors"
              >
                {plan.ctaText}
              </a>
            ) : (
              <button
                onClick={() => handleUpgrade(plan.plan)}
                disabled={loading === plan.plan}
                className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                  plan.plan === "pro"
                    ? "bg-[#6366F1] hover:bg-[#818CF8]"
                    : "bg-[#F59E0B] hover:bg-[#FBBF24]"
                }`}
              >
                {loading === plan.plan ? "Redirecting..." : plan.ctaText}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
