"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getCurrentUser,
  createBillingPortalSession,
  getSubscriptionStatus,
  reactivateSubscription,
  getApiKeyStatus,
  generateApiKey,
  type User,
  type SubscriptionStatus,
} from "@/lib/api";
import { useTheme, type DashboardTheme } from "@/lib/theme";

type TabKey = "general" | "profile" | "billing" | "api_keys";

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
  const { colors } = useTheme();

  const [user, setUser] = useState<User | null>(null);
  const [subStatus, setSubStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [yearly, setYearly] = useState(false);
  const [reactivating, setReactivating] = useState(false);
  const isTrialing = subStatus?.status === "trialing";

  const tabParam = searchParams.get("tab");
  const activeTab: TabKey =
    tabParam === "profile" || tabParam === "billing" || tabParam === "general" || tabParam === "api_keys"
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
    window.location.href = "/#pricing";
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
    return <div style={{ color: colors.textSecondary }}>Loading...</div>;
  }

  const plan = user?.plan || "free";
  const limits = planLimits[plan];

  const navBtnClass = (tab: TabKey) =>
    `flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
      activeTab === tab ? "font-medium" : ""
    }`;

  const navBtnStyle = (tab: TabKey) => ({
    background: activeTab === tab ? colors.bgSurface : "transparent",
    color: activeTab === tab ? colors.textPrimary : colors.textSecondary,
  });

  return (
    <div className="-mx-10 -mt-8 flex flex-col overflow-hidden" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Header */}
      <div className="flex items-center px-10 py-6" style={{ borderBottom: `1px solid ${colors.border}` }}>
        <h1 className="text-2xl font-medium" style={{ color: colors.textPrimary }}>Settings</h1>
      </div>

      {/* Cancellation countdown — shown above sidebar + content */}
      {subStatus?.cancel_at_period_end && countdown && (
        <div className="px-10 pt-6">
          <div className="rounded-xl border border-[#F59E0B]/40 bg-[#F59E0B]/5 p-6 flex flex-col items-center text-center">
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

            <p className="mb-4 text-sm" style={{ color: colors.textSecondary }}>
              Your <span className="font-medium capitalize" style={{ color: colors.textPrimary }}>{plan}</span> plan
              will be cancelled at the end of your billing period. You&apos;ll continue to have
              access until then.
            </p>

            <div className="mb-4 flex justify-center gap-4">
              {[
                { value: countdown.days, label: "Days" },
                { value: countdown.hours, label: "Hours" },
                { value: countdown.minutes, label: "Minutes" },
              ].map((item) => (
                <div
                  key={item.label}
                  className="rounded-lg border px-4 py-3 text-center"
                  style={{ borderColor: colors.border, background: colors.bgBase }}
                >
                  <div className="text-2xl font-bold" style={{ color: colors.textPrimary }}>
                    {String(item.value).padStart(2, "0")}
                  </div>
                  <div className="text-xs" style={{ color: colors.textTertiary }}>{item.label}</div>
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
          <button onClick={() => setActiveTab("general")} className={navBtnClass("general")} style={navBtnStyle("general")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09a1.65 1.65 0 00-1.08-1.51 1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09a1.65 1.65 0 001.51-1.08 1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
            </svg>
            General
          </button>

          <button onClick={() => setActiveTab("profile")} className={navBtnClass("profile")} style={navBtnStyle("profile")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            Profile
          </button>

          <button onClick={() => setActiveTab("billing")} className={navBtnClass("billing")} style={navBtnStyle("billing")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
              <line x1="1" y1="10" x2="23" y2="10" />
            </svg>
            Plans & Billing
          </button>

          <button onClick={() => setActiveTab("api_keys")} className={navBtnClass("api_keys")} style={navBtnStyle("api_keys")}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
            </svg>
            API Keys
          </button>
        </nav>

        {/* Mobile horizontal tabs */}
        <div className="flex md:hidden w-full" style={{ borderBottom: `1px solid ${colors.border}` }}>
          {(["general", "profile", "billing", "api_keys"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="flex flex-1 items-center justify-center gap-2 px-3 py-2.5 text-sm transition-colors capitalize"
              style={{
                borderBottom: activeTab === tab ? "2px solid #6366F1" : "2px solid transparent",
                color: activeTab === tab ? colors.textPrimary : colors.textSecondary,
                fontWeight: activeTab === tab ? 500 : 400,
              }}
            >
              {tab === "billing" ? "Billing" : tab === "api_keys" ? "API Keys" : tab}
            </button>
          ))}
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
              isTrialing={isTrialing}
              trialEnd={subStatus?.trial_end}
              proTrialUsed={user?.pro_trial_used}
              businessTrialUsed={user?.business_trial_used}
            />
          )}
          {activeTab === "api_keys" && <ApiKeysTab />}
        </div>
      </div>
    </div>
  );
}

/* ─── General Tab ─── */

function GeneralTab() {
  const { theme, colors, setTheme } = useTheme();

  const options: { value: DashboardTheme; label: string; icon: React.ReactNode }[] = [
    {
      value: "dark",
      label: "Dark",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      ),
    },
    {
      value: "dim",
      label: "Dim",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" opacity="0.4" />
        </svg>
      ),
    },
    {
      value: "gray",
      label: "Gray",
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a10 10 0 000 20" fill="currentColor" opacity="0.15" />
        </svg>
      ),
    },
    {
      value: "light",
      label: "Light",
      icon: (
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
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>General</h2>
        <p className="text-sm" style={{ color: colors.textSecondary }}>Manage your app preferences.</p>
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: colors.border, background: colors.bgSurface }}>
        <h3 className="text-sm font-medium mb-4" style={{ color: colors.textPrimary }}>Theme</h3>
        <div className="flex flex-wrap gap-3">
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTheme(opt.value)}
              className="flex items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors"
              style={{
                borderColor: theme === opt.value ? "#6366F1" : colors.border,
                background: theme === opt.value ? "rgba(99,102,241,0.1)" : colors.bgBase,
                color: theme === opt.value ? colors.textPrimary : colors.textSecondary,
              }}
            >
              {opt.icon}
              {opt.label}
            </button>
          ))}
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
  const { colors } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>Profile</h2>
        <p className="text-sm" style={{ color: colors.textSecondary }}>Your account information.</p>
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: colors.border, background: colors.bgSurface }}>
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
            <div className="text-lg font-medium" style={{ color: colors.textPrimary }}>
              {clerkUser?.fullName || user?.name || "—"}
            </div>
            <div className="text-sm" style={{ color: colors.textSecondary }}>
              {clerkUser?.primaryEmailAddress?.emailAddress || user?.email || "—"}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs mb-1" style={{ color: colors.textSecondary }}>Name</div>
              <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: colors.border, background: colors.bgBase, color: colors.textPrimary }}>
                {clerkUser?.fullName || user?.name || "—"}
              </div>
            </div>
            <div>
              <div className="text-xs mb-1" style={{ color: colors.textSecondary }}>Email</div>
              <div className="rounded-lg border px-3 py-2 text-sm" style={{ borderColor: colors.border, background: colors.bgBase, color: colors.textPrimary }}>
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
  isTrialing,
  trialEnd,
  proTrialUsed,
  businessTrialUsed,
}: {
  plan: string;
  limits: { products: string; proofs: string; generations: string; versions: string };
  yearly: boolean;
  setYearly: (v: boolean) => void;
  onUpgrade: (plan: string) => void;
  onManageBilling: () => void;
  isTrialing?: boolean;
  trialEnd?: number | null;
  proTrialUsed?: boolean;
  businessTrialUsed?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>Plans & Billing</h2>
        <p className="text-sm" style={{ color: colors.textSecondary }}>Manage your subscription and billing details.</p>
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: colors.border, background: colors.bgSurface }}>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-sm font-medium" style={{ color: colors.textPrimary }}>Current Plan</h3>
          <span
            className={`rounded-full px-3 py-0.5 text-xs font-medium capitalize ${planBadgeColors[plan]}`}
          >
            {plan}
          </span>
        </div>

        {isTrialing && trialEnd && (
          <div className="mb-4 rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 px-4 py-3 text-sm text-[#22C55E]">
            You&apos;re on a 7-day free trial of <span className="font-medium capitalize">{plan}</span>. Your trial ends on{" "}
            {new Date(trialEnd * 1000).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.
          </div>
        )}

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
              className="rounded-lg border p-3"
              style={{ borderColor: colors.border, background: colors.bgBase }}
            >
              <div className="text-xs" style={{ color: colors.textSecondary }}>{item.label}</div>
              <div className="mt-1 text-sm font-medium" style={{ color: colors.textPrimary }}>
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
                <span className="text-xs" style={{ color: !yearly ? colors.textPrimary : colors.textSecondary }}>
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
                <span className="text-xs" style={{ color: yearly ? colors.textPrimary : colors.textSecondary }}>
                  Yearly
                </span>
              </div>

              {plan === "free" && (
                <>
                  <button
                    onClick={() => onUpgrade("pro")}
                    className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors"
                  >
                    {proTrialUsed
                      ? `Upgrade to Pro (${yearly ? "$9" : "$12"}/mo)`
                      : `Start Free Trial — Pro (${yearly ? "$9" : "$12"}/mo)`}
                  </button>
                  <button
                    onClick={() => onUpgrade("business")}
                    className="rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-medium text-white hover:bg-[#FBBF24] transition-colors"
                  >
                    {businessTrialUsed
                      ? `Upgrade to Business (${yearly ? "$24" : "$29"}/mo)`
                      : `Start Free Trial — Business (${yearly ? "$24" : "$29"}/mo)`}
                  </button>
                </>
              )}
              {plan === "pro" && (
                <button
                  onClick={() => onUpgrade("business")}
                  className="rounded-lg bg-[#F59E0B] px-4 py-2 text-sm font-medium text-white hover:bg-[#FBBF24] transition-colors"
                >
                  {businessTrialUsed
                    ? `Upgrade to Business (${yearly ? "$24" : "$29"}/mo)`
                    : `Start Free Trial — Business (${yearly ? "$24" : "$29"}/mo)`}
                </button>
              )}
            </>
          )}

          {plan !== "free" && (
            <button
              onClick={onManageBilling}
              className="rounded-lg border px-4 py-2 text-sm transition-colors"
              style={{ borderColor: colors.border, color: colors.textPrimary }}
            >
              Manage Billing
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── API Keys Tab ─── */

function ApiKeysTab() {
  const { getToken } = useAuth();
  const { colors } = useTheme();
  const [hasKey, setHasKey] = useState(false);
  const [newKey, setNewKey] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const status = await getApiKeyStatus(token);
        setHasKey(status.has_key);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    })();
  }, [getToken]);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const token = await getToken();
      if (!token) return;
      const result = await generateApiKey(token);
      setNewKey(result.api_key);
      setHasKey(true);
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <div style={{ color: colors.textSecondary }}>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: colors.textPrimary }}>API Keys</h2>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Generate an API key to use with the ShipProof Chrome Extension.
        </p>
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: colors.border, background: colors.bgSurface }}>
        {newKey ? (
          <div className="space-y-4">
            <div className="rounded-lg bg-[#22C55E]/10 border border-[#22C55E]/20 px-4 py-3 text-sm text-[#22C55E]">
              Your API key has been generated. Copy it now — it won&apos;t be shown again.
            </div>
            <div className="flex items-center gap-2">
              <code
                className="flex-1 rounded-lg border px-4 py-3 text-sm font-mono select-all"
                style={{ borderColor: colors.border, background: colors.bgBase, color: colors.textPrimary }}
              >
                {newKey}
              </code>
              <button
                onClick={handleCopy}
                className="rounded-lg bg-[#6366F1] px-4 py-3 text-sm font-medium text-white hover:bg-[#818CF8] transition-colors"
              >
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>
            <button
              onClick={() => setNewKey(null)}
              className="text-sm transition-colors"
              style={{ color: colors.textSecondary }}
            >
              Done
            </button>
          </div>
        ) : hasKey ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: "#22C55E" }}>API key is active</span>
            </div>
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              Regenerating will invalidate your current key. Any extensions using the old key will need to be updated.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50"
              style={{ borderColor: colors.border, color: colors.textPrimary }}
            >
              {generating ? "Generating..." : "Regenerate API Key"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm" style={{ color: colors.textSecondary }}>
              You don&apos;t have an API key yet. Generate one to connect the Chrome Extension.
            </p>
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="rounded-lg bg-[#6366F1] px-4 py-2 text-sm font-medium text-white hover:bg-[#818CF8] disabled:opacity-50 transition-colors"
            >
              {generating ? "Generating..." : "Generate API Key"}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border p-6" style={{ borderColor: colors.border, background: colors.bgSurface }}>
        <h3 className="text-sm font-medium mb-2" style={{ color: colors.textPrimary }}>Chrome Extension</h3>
        <p className="text-sm" style={{ color: colors.textSecondary }}>
          Capture social proof from anywhere on the web. Screenshots, text, automatic platform detection.
        </p>
        <p className="text-sm mt-2" style={{ color: colors.textTertiary }}>
          Coming soon to the Chrome Web Store.
        </p>
      </div>
    </div>
  );
}
