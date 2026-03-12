"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useEffect, useState } from "react";
import {
  getCurrentUser,
  createCheckoutSession,
  createBillingPortalSession,
  type User,
} from "@/lib/api";

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

const planBadgeColors: Record<string, string> = {
  free: "bg-[#3F3F46] text-[#9CA3AF]",
  pro: "bg-[#6366F1]/20 text-[#818CF8]",
  business: "bg-[#F59E0B]/20 text-[#FBBF24]",
};

const planLimits: Record<
  string,
  { products: string; proofs: string; generations: string; versions: string }
> = {
  free: { products: "1", proofs: "1 / product", generations: "3 / month", versions: "3 / product" },
  pro: { products: "1", proofs: "Unlimited", generations: "Unlimited", versions: "Unlimited" },
  business: { products: "10", proofs: "Unlimited", generations: "Unlimited", versions: "Unlimited" },
};

export default function SettingsPage() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearly, setYearly] = useState(false);
  const [upgrading, setUpgrading] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUser() {
      try {
        const token = await getToken();
        if (!token) return;
        const data = await getCurrentUser(token);
        setUser(data);
      } catch {
        // handle error
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan);
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
      setUpgrading(null);
    }
  };

  const handleManageBilling = async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const { url } = await createBillingPortalSession(token);
      window.location.href = url;
    } catch {
      // handle error
    }
  };

  if (loading) {
    return <div className="text-[#9CA3AF]">Loading...</div>;
  }

  const plan = user?.plan || "free";
  const limits = planLimits[plan];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#F1F1F3]">Settings</h1>

      {/* Plan & Billing */}
      <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#F1F1F3]">
            Plan & Billing
          </h2>
          <span
            className={`rounded-full px-3 py-0.5 text-xs font-medium capitalize ${planBadgeColors[plan]}`}
          >
            {plan}
          </span>
        </div>

        {/* Limits grid */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { label: "Products", value: limits.products },
            { label: "Proofs", value: limits.proofs },
            { label: "AI Generations", value: limits.generations },
            { label: "Versions", value: limits.versions },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border border-[#2A2A30] bg-[#0F0F10] p-3"
            >
              <div className="text-xs text-[#9CA3AF]">{item.label}</div>
              <div className="mt-1 text-sm font-medium text-[#F1F1F3]">
                {item.value}
              </div>
            </div>
          ))}
        </div>

        {/* Upgrade / Billing buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {plan !== "business" && (
            <>
              {/* Monthly/Yearly toggle */}
              <div className="flex items-center gap-2 mr-4">
                <span
                  className={`text-xs ${!yearly ? "text-[#F1F1F3]" : "text-[#9CA3AF]"}`}
                >
                  Monthly
                </span>
                <button
                  onClick={() => setYearly(!yearly)}
                  className={`relative h-5 w-9 rounded-full transition-colors ${
                    yearly ? "bg-[#6366F1]" : "bg-[#3F3F46]"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                      yearly ? "translate-x-4" : ""
                    }`}
                  />
                </button>
                <span
                  className={`text-xs ${yearly ? "text-[#F1F1F3]" : "text-[#9CA3AF]"}`}
                >
                  Yearly
                </span>
              </div>

              {plan === "free" && (
                <>
                  <button
                    onClick={() => handleUpgrade("pro")}
                    disabled={upgrading === "pro"}
                    className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
                  >
                    {upgrading === "pro"
                      ? "Redirecting..."
                      : `Upgrade to Pro (${yearly ? "$9" : "$12"}/mo)`}
                  </button>
                  <button
                    onClick={() => handleUpgrade("business")}
                    disabled={upgrading === "business"}
                    className="rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-medium text-white hover:bg-[#FBBF24] disabled:opacity-50 transition-colors"
                  >
                    {upgrading === "business"
                      ? "Redirecting..."
                      : `Upgrade to Business (${yearly ? "$24" : "$29"}/mo)`}
                  </button>
                </>
              )}
              {plan === "pro" && (
                <button
                  onClick={() => handleUpgrade("business")}
                  disabled={upgrading === "business"}
                  className="rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-medium text-white hover:bg-[#FBBF24] disabled:opacity-50 transition-colors"
                >
                  {upgrading === "business"
                    ? "Redirecting..."
                    : `Upgrade to Business (${yearly ? "$24" : "$29"}/mo)`}
                </button>
              )}
            </>
          )}

          {plan !== "free" && (
            <button
              onClick={handleManageBilling}
              className="rounded-lg border border-[#2A2A30] px-4 py-2 text-sm text-[#F1F1F3] hover:bg-[#2A2A30] transition-colors"
            >
              Manage Billing
            </button>
          )}
        </div>
      </div>

      {/* Account */}
      <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[#F1F1F3]">Account</h2>
        <div className="space-y-3">
          <div>
            <div className="text-xs text-[#9CA3AF]">Name</div>
            <div className="text-sm text-[#F1F1F3]">
              {clerkUser?.fullName || user?.name || "—"}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#9CA3AF]">Email</div>
            <div className="text-sm text-[#F1F1F3]">
              {clerkUser?.primaryEmailAddress?.emailAddress ||
                user?.email ||
                "—"}
            </div>
          </div>
        </div>
        <button
          onClick={() =>
            (window.location.href = "/user-profile")
          }
          className="mt-4 rounded-lg border border-[#2A2A30] px-4 py-2 text-sm text-[#F1F1F3] hover:bg-[#2A2A30] transition-colors"
        >
          Manage Account
        </button>
      </div>
    </div>
  );
}
