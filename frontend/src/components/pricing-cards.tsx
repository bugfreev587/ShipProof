"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { createCheckoutSession, getCurrentUser } from "@/lib/api";

type FeatureType = "included" | "excluded" | "info";

const plans: {
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  badge: string | null;
  borderColor: string;
  badgeColor: string;
  description?: string;
  features: { text: string; type: FeatureType }[];
  ctaText: string;
  ctaLink?: string;
  plan: string;
}[] = [
  {
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    badge: null,
    borderColor: "border-[#2A2A30]",
    badgeColor: "",
    features: [
      { text: "1 Product", type: "included" },
      { text: "5 Proofs", type: "included" },
      { text: "3 AI generations / month", type: "included" },
      { text: "Wall of Love page", type: "included" },
      { text: "Embeddable Widget", type: "included" },
      { text: "Marquee & Carousel layouts", type: "included" },
      { text: '"Powered by ShipProof" badge', type: "info" },
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
    description: "Everything in Free, plus:",
    features: [
      { text: "Unlimited Proofs", type: "included" },
      { text: "Unlimited AI generations", type: "included" },
      { text: "Unlimited Launch Versions", type: "included" },
      { text: "Chrome Extension support", type: "included" },
      { text: "Priority support", type: "included" },
      { text: '"Powered by ShipProof" badge', type: "info" },
    ],
    ctaText: "Start Free Trial",
    plan: "pro",
  },
  {
    name: "Business",
    monthlyPrice: 29,
    yearlyPrice: 24,
    badge: null,
    borderColor: "border-[#2A2A30]",
    badgeColor: "",
    description: "Everything in Pro, plus:",
    features: [
      { text: "Up to 10 Products", type: "included" },
      { text: 'Remove "Powered by" badge', type: "included" },
      { text: "Custom branding", type: "included" },
      { text: "Team features (coming soon)", type: "included" },
    ],
    ctaText: "Start Free Trial",
    plan: "business",
  },
];

const fallbackPriceIds: Record<string, { monthly: string; yearly: string }> = {
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
  const [error, setError] = useState("");
  const [priceIds, setPriceIds] = useState(fallbackPriceIds);
  const [trialsUsed, setTrialsUsed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!isSignedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token || cancelled) return;
        const user = await getCurrentUser(token);
        const sp = user.stripe_prices;
        if (sp && !cancelled) {
          setPriceIds({
            pro: { monthly: sp.pro_monthly, yearly: sp.pro_yearly },
            business: { monthly: sp.business_monthly, yearly: sp.business_yearly },
          });
        }
        if (!cancelled) {
          setTrialsUsed({
            pro: user.pro_trial_used,
            business: user.business_trial_used,
          });
        }
      } catch {
        // fall back to env vars
      }
    })();
    return () => { cancelled = true; };
  }, [isSignedIn, getToken]);

  const handleUpgrade = async (plan: string) => {
    if (!isSignedIn) {
      window.location.href = "/sign-up";
      return;
    }
    setLoading(plan);
    setError("");
    try {
      const token = await getToken();
      if (!token) return;
      const period = yearly ? "yearly" : "monthly";
      const priceId = priceIds[plan]?.[period];
      if (!priceId) {
        setError(
          "Stripe is not configured yet. Please set the price ID environment variables.",
        );
        return;
      }
      const { url } = await createCheckoutSession(
        { price_id: priceId, plan },
        token,
      );
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to start checkout. Please try again.",
      );
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

      {error && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-400 text-center">
          {error}
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3 items-stretch">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col rounded-xl border ${plan.borderColor} bg-[#1A1A1F] p-6`}
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

            {plan.description && (
              <p className="text-xs text-[#9CA3AF] mb-2">{plan.description}</p>
            )}

            <ul className="flex-1 space-y-2">
              {plan.features.map((feature) => (
                <li key={feature.text} className="flex items-center gap-2 text-sm">
                  {feature.type === "included" ? (
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
                  ) : feature.type === "info" ? (
                    <svg
                      className="h-4 w-4 shrink-0 text-[#6366F1]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
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
                      feature.type === "excluded" ? "text-[#6B7280]" : "text-[#F1F1F3]"
                    }
                  >
                    {feature.text}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              {plan.plan === "free" ? (
                <a
                  href={plan.ctaLink}
                  className="block w-full rounded-lg border border-[#2A2A30] px-4 py-2 text-center text-sm font-medium text-[#F1F1F3] hover:bg-[#2A2A30] transition-colors"
                >
                  {plan.ctaText}
                </a>
              ) : (
                <>
                  <button
                    onClick={() => handleUpgrade(plan.plan)}
                    disabled={loading === plan.plan}
                    className={`w-full rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                      plan.plan === "pro"
                        ? "bg-[#6366F1] hover:bg-[#818CF8]"
                        : "bg-[#F59E0B] hover:bg-[#FBBF24]"
                    }`}
                  >
                    {loading === plan.plan
                      ? "Redirecting..."
                      : trialsUsed[plan.plan]
                        ? `Upgrade to ${plan.name}`
                        : plan.ctaText}
                  </button>
                  {!trialsUsed[plan.plan] && (
                    <p className="mt-2 text-center text-xs text-[#22C55E]">
                      7-day free trial
                    </p>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
