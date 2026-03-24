"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getCurrentUser,
  getAdminStats,
  getAdminAnalytics,
  getAdminUsers,
  getAdminRecentSignups,
  type AdminStats,
  type AdminAnalytics,
  type AdminUsersResponse,
  type AdminRecentSignup,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function planBadge(plan: string) {
  const colors: Record<string, string> = {
    free: "bg-[#2A2A30] text-[#9CA3AF]",
    pro: "bg-[#6366F1]/20 text-[#818CF8]",
    business: "bg-[#8B5CF6]/20 text-[#A78BFA]",
  };
  return (
    <span
      className={`text-xs px-2 py-0.5 rounded-full font-medium ${colors[plan] || colors.free}`}
    >
      {plan}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminPage() {
  const { getToken } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [users, setUsers] = useState<AdminUsersResponse | null>(null);
  const [recentSignups, setRecentSignups] = useState<AdminRecentSignup[]>([]);
  const [period, setPeriod] = useState("7d");
  const [searchQuery, setSearchQuery] = useState("");
  const [userPage, setUserPage] = useState(1);

  // Auth check + initial data load
  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        router.replace("/dashboard");
        return;
      }
      try {
        const me = await getCurrentUser(token);
        if (!me.is_admin) {
          router.replace("/dashboard");
          return;
        }
      } catch {
        router.replace("/dashboard");
        return;
      }
      setLoading(false);
    })();
  }, [getToken, router]);

  // Fetch all data
  const fetchData = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    const [s, a, u, rs] = await Promise.all([
      getAdminStats(token),
      getAdminAnalytics(token, period),
      getAdminUsers(token, userPage, 20, searchQuery),
      getAdminRecentSignups(token),
    ]);
    setStats(s);
    setAnalytics(a);
    setUsers(u);
    setRecentSignups(rs);
  }, [getToken, period, userPage, searchQuery]);

  useEffect(() => {
    if (!loading) fetchData();
  }, [loading, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-[var(--text-secondary)]">
        Loading...
      </div>
    );
  }

  const totalPages = users ? Math.ceil(users.total / users.limit) : 1;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
        Admin Dashboard
      </h1>

      {/* Overview Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            label="Total Users"
            value={stats.total_users}
            sub={`+${stats.signups_this_week} this week`}
          />
          <Card
            label="Paid Users"
            value={stats.paid_users}
            sub={`+${stats.paid_this_week} this week`}
          />
          <Card
            label="MRR"
            value={`$${stats.mrr}`}
            sub={`+$${stats.mrr_change_this_week} this week`}
          />
          <Card
            label="Today's Views"
            value={stats.total_page_views_today}
            sub={`${stats.total_page_views} total`}
          />
        </div>
      )}

      {/* Page Views Chart */}
      {analytics && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-[var(--text-primary)]">
              Page views
            </h2>
            <div className="flex gap-1">
              {(["7d", "30d", "all"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-3 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                    period === p
                      ? "bg-[#6366F1]/20 text-[#818CF8]"
                      : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
                  }`}
                >
                  {p === "all" ? "All time" : p}
                </button>
              ))}
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.by_day}>
                <CartesianGrid stroke="#1E1E24" strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#6B7280", fontSize: 11 }}
                  tickFormatter={(v: string) =>
                    v ? new Date(v + "T00:00:00").toLocaleDateString("en", { month: "short", day: "numeric" }) : ""
                  }
                />
                <YAxis tick={{ fill: "#6B7280", fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A1A1F",
                    border: "1px solid #2A2A30",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelStyle={{ color: "#9CA3AF" }}
                />
                <Bar dataKey="views" fill="#6366F1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Top Pages + Traffic Sources */}
      {analytics && (
        <div className="grid md:grid-cols-2 gap-4">
          {/* Top Pages */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-4">
              Top pages
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--text-tertiary)] text-xs">
                  <th className="text-left pb-2">Path</th>
                  <th className="text-right pb-2">Views</th>
                  <th className="text-right pb-2">%</th>
                </tr>
              </thead>
              <tbody>
                {analytics.by_page.map((p) => (
                  <tr
                    key={p.path}
                    className="border-t border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <td className="py-2 text-[var(--text-primary)] font-mono text-xs">
                      {p.path}
                    </td>
                    <td className="py-2 text-right text-[var(--text-secondary)]">
                      {p.views}
                    </td>
                    <td className="py-2 text-right text-[var(--text-tertiary)]">
                      {analytics.summary.period_views > 0
                        ? ((p.views / analytics.summary.period_views) * 100).toFixed(1)
                        : 0}
                      %
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Referrers */}
          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-4">
              Top referrers
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--text-tertiary)] text-xs">
                  <th className="text-left pb-2">Source</th>
                  <th className="text-right pb-2">Views</th>
                </tr>
              </thead>
              <tbody>
                {analytics.top_referrers.map((r, i) => (
                  <tr
                    key={i}
                    className="border-t border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <td className="py-2 text-[var(--text-primary)] text-xs">
                      {String(r.referrer)}
                    </td>
                    <td className="py-2 text-right text-[var(--text-secondary)]">
                      {r.views}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {/* UTM Sources + Campaigns */}
      {analytics && (
        <div className="grid md:grid-cols-2 gap-4">
          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-4">
              UTM Sources
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--text-tertiary)] text-xs">
                  <th className="text-left pb-2">Source</th>
                  <th className="text-right pb-2">Views</th>
                </tr>
              </thead>
              <tbody>
                {analytics.top_utm_sources.map((u, i) => (
                  <tr
                    key={i}
                    className="border-t border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <td className="py-2 text-[var(--text-primary)] text-xs">
                      {u.utm_source}
                    </td>
                    <td className="py-2 text-right text-[var(--text-secondary)]">
                      {u.views}
                    </td>
                  </tr>
                ))}
                {analytics.top_utm_sources.length === 0 && (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-[var(--text-tertiary)] text-xs">
                      No UTM data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-4">
              UTM Campaigns
            </h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--text-tertiary)] text-xs">
                  <th className="text-left pb-2">Source</th>
                  <th className="text-left pb-2">Campaign</th>
                  <th className="text-right pb-2">Views</th>
                </tr>
              </thead>
              <tbody>
                {analytics.utm_campaigns.map((c, i) => (
                  <tr
                    key={i}
                    className="border-t border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <td className="py-2 text-[var(--text-primary)] text-xs">
                      {String(c.utm_source)}
                    </td>
                    <td className="py-2 text-[var(--text-secondary)] text-xs">
                      {String(c.utm_campaign)}
                    </td>
                    <td className="py-2 text-right text-[var(--text-secondary)]">
                      {c.views}
                    </td>
                  </tr>
                ))}
                {analytics.utm_campaigns.length === 0 && (
                  <tr>
                    <td colSpan={3} className="py-4 text-center text-[var(--text-tertiary)] text-xs">
                      No campaign data yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>
        </div>
      )}

      {/* Users Table */}
      {users && (
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-[var(--text-primary)]">
              Users{" "}
              <span className="text-xs font-normal text-[var(--text-tertiary)] ml-1">
                {users.total}
              </span>
            </h2>
            <input
              type="text"
              placeholder="Search name or email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setUserPage(1);
              }}
              className="bg-[var(--bg-elevated)] border border-[var(--border)] rounded-lg px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] w-56 focus:outline-none focus:border-[#6366F1]/50"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[var(--text-tertiary)] text-xs">
                  <th className="text-left pb-2">Name</th>
                  <th className="text-left pb-2">Email</th>
                  <th className="text-left pb-2">Plan</th>
                  <th className="text-right pb-2">Products</th>
                  <th className="text-right pb-2">Proofs</th>
                  <th className="text-right pb-2">Signed up</th>
                </tr>
              </thead>
              <tbody>
                {users.users.map((u) => (
                  <tr
                    key={u.id}
                    className="border-t border-[var(--border)] hover:bg-[var(--bg-elevated)] transition-colors"
                  >
                    <td className="py-2 text-[var(--text-primary)]">
                      {u.name || "—"}
                    </td>
                    <td className="py-2 text-[var(--text-secondary)] text-xs">
                      {u.email}
                    </td>
                    <td className="py-2">{planBadge(u.plan)}</td>
                    <td className="py-2 text-right text-[var(--text-secondary)]">
                      {u.product_count}
                    </td>
                    <td className="py-2 text-right text-[var(--text-secondary)]">
                      {u.proof_count}
                    </td>
                    <td className="py-2 text-right text-[var(--text-tertiary)] text-xs">
                      {new Date(u.created_at).toLocaleDateString("en", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4">
              <button
                onClick={() => setUserPage((p) => Math.max(1, p - 1))}
                disabled={userPage === 1}
                className="px-3 py-1 text-xs rounded border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              >
                Prev
              </button>
              <span className="text-xs text-[var(--text-tertiary)]">
                {userPage} / {totalPages}
              </span>
              <button
                onClick={() => setUserPage((p) => Math.min(totalPages, p + 1))}
                disabled={userPage === totalPages}
                className="px-3 py-1 text-xs rounded border border-[var(--border)] text-[var(--text-secondary)] disabled:opacity-30 hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
              >
                Next
              </button>
            </div>
          )}
        </section>
      )}

      {/* Recent Signups + Plan Distribution */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Recent Signups */}
        <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
          <h2 className="text-base font-medium text-[var(--text-primary)] mb-4">
            Recent signups (7 days)
          </h2>
          <div className="space-y-3">
            {recentSignups.map((s) => (
              <div key={s.id} className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-[#6366F1]/20 flex items-center justify-center text-xs font-medium text-[#818CF8] shrink-0">
                  {(s.name?.[0] || s.email[0]).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[var(--text-primary)] truncate">
                    {s.name || s.email}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)] truncate">
                    {s.email}
                  </p>
                </div>
                <span className="text-xs text-[var(--text-tertiary)] shrink-0">
                  {timeAgo(s.created_at)}
                </span>
              </div>
            ))}
            {recentSignups.length === 0 && (
              <p className="text-xs text-[var(--text-tertiary)] text-center py-4">
                No signups in the last 7 days
              </p>
            )}
          </div>
        </section>

        {/* Plan Distribution */}
        {stats && (
          <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
            <h2 className="text-base font-medium text-[var(--text-primary)] mb-4">
              Plan distribution
            </h2>
            <div className="space-y-4">
              {(
                [
                  {
                    label: "Free",
                    count: stats.plan_distribution.free,
                    color: "#6B7280",
                  },
                  {
                    label: "Pro",
                    count: stats.plan_distribution.pro,
                    color: "#6366F1",
                  },
                  {
                    label: "Business",
                    count: stats.plan_distribution.business,
                    color: "#8B5CF6",
                  },
                ] as const
              ).map((item) => {
                const pct =
                  stats.total_users > 0
                    ? (item.count / stats.total_users) * 100
                    : 0;
                return (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[var(--text-primary)]">
                        {item.label}
                      </span>
                      <span className="text-[var(--text-tertiary)]">
                        {item.count} users ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#1E1E24] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Card component
// ---------------------------------------------------------------------------

function Card({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub: string;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-5">
      <p className="text-xs text-[var(--text-tertiary)] mb-1">{label}</p>
      <p className="text-2xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
      <p className="text-xs text-[#22C55E] mt-1">{sub}</p>
    </div>
  );
}
