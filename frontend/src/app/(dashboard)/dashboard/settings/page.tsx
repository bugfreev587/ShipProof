"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getCurrentUser,
  createBillingPortalSession,
  getSubscriptionStatus,
  reactivateSubscription,
  type User,
  type SubscriptionStatus,
} from "@/lib/api";

type TabKey = "general" | "profile" | "billing";

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

function useCountdown(targetTimestamp: number | null) {
  const [remaining, setRemaining] = useState<{
    days: number;
    hours: number;
    minutes: number;
  } | null>(null);

  useEffect(() => {
    if (!targetTimestamp) {
      setRemaining(null);
      return;
    }

    const calc = () => {
      const now = Date.now();
      const end = targetTimestamp * 1000;
      const diff = end - now;
      if (diff <= 0) {
        setRemaining(null);
        return;
      }
      setRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
      });
    };

    calc();
    const interval = setInterval(calc, 60_000);
    return () => clearInterval(interval);
  }, [targetTimestamp]);

  return remaining;
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="text-[#9CA3AF]">Loading...</div>}>
      <SettingsContent />
    </Suspense>
  );
}

function SettingsContent() {
  const { getToken } = useAuth();
  const { user: clerkUser } = useUser();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearly, setYearly] = useState(false);
  const [reactivating, setReactivating] = useState(false);

  const tabParam = searchParams.get("tab");
  const activeTab: TabKey =
    tabParam === "profile" || tabParam === "billing" || tabParam === "general"
      ? tabParam
      : "general";

  const setActiveTab = useCallback(
    (tab: TabKey) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", tab);
      router.replace(`?${params.toString()}`, { scroll: false });
    },
    [searchParams, router],
  );

  const fetchData = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) return;
      const [userData, subData] = await Promise.all([
        getCurrentUser(token),
        getSubscriptionStatus(token),
      ]);
      setUser(userData);
      setSubStatus(subData);
    } catch {
      // handle error
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpgrade = (plan: string) => {
    void plan;
    window.location.href = "/pricing";
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

  const handleReactivate = async () => {
    setReactivating(true);
    try {
      const token = await getToken();
      if (!token) return;
      await reactivateSubscription(token);
      await fetchData();
    } catch {
      // handle error
    } finally {
      setReactivating(false);
    }
  };

  const countdown = useCountdown(
    subStatus?.cancel_at_period_end ? subStatus.current_period_end : null,
  );

  if (loading) {
    return <div className="text-[#9CA3AF]">Loading...</div>;
  }

  const plan = user?.plan || "free";
  const limits = planLimits[plan];

  return (
    <div className="-mx-10 -mt-8 flex flex-col" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Header */}
      <div className="flex items-center px-10 py-6 border-b border-[#2A2A30]">
        <h1 className="text-2xl font-medium text-[#F1F1F3]">Settings</h1>
      </div>

      {/* Cancellation countdown — shown above sidebar + content */}
      {subStatus?.cancel_at_period_end && countdown && (
        <div className="px-10 pt-6">
          <div className="rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/5 p-6">
            <div className="mb-3 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-[#F59E0B]"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <h3 className="text-base font-semibold text-[#F59E0B]">
                Subscription Cancelling
              </h3>
            </div>

            <p className="mb-4 text-sm text-[#9CA3AF]">
              Your <span className="font-medium text-[#F1F1F3] capitalize">{plan}</span> plan
              will be cancelled at the end of your billing period. You&apos;ll continue to have
              access until then.
            </p>

            <div className="mb-4 flex gap-4">
              {[
                { value: countdown.days, label: "Days" },
                { value: countdown.hours, label: "Hours" },
                { value: countdown.minutes, label: "Minutes" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-4 py-3 text-center"
                >
                  <div className="text-2xl font-bold text-[#F1F1F3]">
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <div className="text-xs text-[#6B7280]">{item.label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={handleReactivate}
              disabled={reactivating}
              className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
            >
              {reactivating ? "Reactivating..." : "Revoke Cancellation"}
            </button>
          </div>
        </div>
      )}

      {/* Sidebar + Content */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar — hidden on mobile */}
        <nav className="hidden md:flex w-60 flex-col gap-1 p-6">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              activeTab === "general"
                ? "bg-[#1A1A1F] text-[#F1F1F3] font-medium"
                : "text-[#9CA3AF] hover:text-[#F1F1F3] hover:bg-[#1A1A1F]"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            General
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              activeTab === "profile"
                ? "bg-[#1A1A1F] text-[#F1F1F3] font-medium"
                : "text-[#9CA3AF] hover:text-[#F1F1F3] hover:bg-[#1A1A1F]"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </button>

          <button
            onClick={() => setActiveTab("billing")}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
              activeTab === "billing"
                ? "bg-[#1A1A1F] text-[#F1F1F3] font-medium"
                : "text-[#9CA3AF] hover:text-[#F1F1F3] hover:bg-[#1A1A1F]"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            Plans & Billing
          </button>
        </nav>

        {/* Mobile horizontal tabs */}
        <div className="flex md:hidden border-b border-[#2A2A30] w-full">
          <button
            onClick={() => setActiveTab("general")}
            className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm transition-colors ${
              activeTab === "general"
                ? "border-b-2 border-[#6366F1] text-[#F1F1F3] font-medium"
                : "text-[#9CA3AF] hover:text-[#F1F1F3]"
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm transition-colors ${
              activeTab === "profile"
                ? "border-b-2 border-[#6366F1] text-[#F1F1F3] font-medium"
                : "text-[#9CA3AF] hover:text-[#F1F1F3]"
            }`}
          >
            Profile
          </button>
          <button
            onClick={() => setActiveTab("billing")}
            className={`flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm transition-colors ${
              activeTab === "billing"
                ? "border-b-2 border-[#6366F1] text-[#F1F1F3] font-medium"
                : "text-[#9CA3AF] hover:text-[#F1F1F3]"
            }`}
          >
            Billing
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-12 py-8">
          {activeTab === "general" && <GeneralTab />}
          {activeTab === "profile" && (
            <ProfileTab user={user} clerkUser={clerkUser} />
          )}
          {activeTab === "billing" && (
            <BillingTab
              plan={plan}
              limits={limits}
              yearly={yearly}
              setYearly={setYearly}
              onUpgrade={handleUpgrade}
              onManageBilling={handleManageBilling}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── General Tab ─── */

function GeneralTab() {
  const [theme, setTheme] = useState<"light" | "dark">("dark");

  useEffect(() => {
    const saved = localStorage.getItem("shipproof-theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    }
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark") => {
    setTheme(newTheme);
    localStorage.setItem("shipproof-theme", newTheme);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#F1F1F3] mb-1">General</h2>
        <p className="text-sm text-[#9CA3AF]">Manage your app preferences.</p>
      </div>

      <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6">
        <h3 className="text-sm font-medium text-[#F1F1F3] mb-4">Theme</h3>
        <div className="flex gap-3">
          <button
            onClick={() => handleThemeChange("dark")}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
              theme === "dark"
                ? "border-[#6366F1] bg-[#6366F1]/10 text-[#F1F1F3]"
                : "border-[#2A2A30] bg-[#0F0F10] text-[#9CA3AF] hover:border-[#3F3F46]"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
            </svg>
            Dark
          </button>
          <button
            onClick={() => handleThemeChange("light")}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
              theme === "light"
                ? "border-[#6366F1] bg-[#6366F1]/10 text-[#F1F1F3]"
                : "border-[#2A2A30] bg-[#0F0F10] text-[#9CA3AF] hover:border-[#3F3F46]"
            }`}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
            Light
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Profile Tab ─── */

function ProfileTab({
  user,
  clerkUser,
}: {
  user: User | null;
  clerkUser: ReturnType<typeof useUser>["user"];
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#F1F1F3] mb-1">Profile</h2>
        <p className="text-sm text-[#9CA3AF]">Your account information.</p>
      </div>

      <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6">
        <div className="flex items-center gap-4 mb-6">
          {clerkUser?.imageUrl ? (
            <img
              src={clerkUser.imageUrl}
              alt={clerkUser.fullName || "Avatar"}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#6366F1] text-white font-semibold text-xl">
              {(clerkUser?.fullName || user?.name || "U").charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-lg font-medium text-[#F1F1F3]">
              {clerkUser?.fullName || user?.name || "—"}
            </div>
            <div className="text-sm text-[#9CA3AF]">
              {clerkUser?.primaryEmailAddress?.emailAddress || user?.email || "—"}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-[#9CA3AF] mb-1">Name</div>
              <div className="rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3]">
                {clerkUser?.fullName || user?.name || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-[#9CA3AF] mb-1">Email</div>
              <div className="rounded-lg border border-[#2A2A30] bg-[#0F0F10] px-3 py-2 text-sm text-[#F1F1F3]">
                {clerkUser?.primaryEmailAddress?.emailAddress || user?.email || "—"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Billing Tab ─── */

function BillingTab({
  plan,
  limits,
  yearly,
  setYearly,
  onUpgrade,
  onManageBilling,
}: {
  plan: string;
  limits: { products: string; proofs: string; generations: string; versions: string };
  yearly: boolean;
  setYearly: (v: boolean) => void;
  onUpgrade: (plan: string) => void;
  onManageBilling: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-[#F1F1F3] mb-1">Plans & Billing</h2>
        <p className="text-sm text-[#9CA3AF]">Manage your subscription and billing details.</p>
      </div>

      <div className="rounded-xl border border-[#2A2A30] bg-[#1A1A1F] p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium text-[#F1F1F3]">Current Plan</h3>
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
                    onClick={() => onUpgrade("pro")}
                    className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors"
                  >
                    Upgrade to Pro ({yearly ? "$9" : "$12"}/mo)
                  </button>
                  <button
                    onClick={() => onUpgrade("business")}
                    className="rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-medium text-white hover:bg-[#FBBF24] transition-colors"
                  >
                    Upgrade to Business ({yearly ? "$24" : "$29"}/mo)
                  </button>
                </>
              )}
              {plan === "pro" && (
                <button
                  onClick={() => onUpgrade("business")}
                  className="rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-medium text-white hover:bg-[#FBBF24] transition-colors"
                >
                  Upgrade to Business ({yearly ? "$24" : "$29"}/mo)
                </button>
              )}
            </>
          )}

          {plan !== "free" && (
            <button
              onClick={onManageBilling}
              className="rounded-lg border border-[#2A2A30] px-4 py-2 text-sm text-[#F1F1F3] hover:bg-[#2A2A30] transition-colors"
            >
              Manage Billing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
