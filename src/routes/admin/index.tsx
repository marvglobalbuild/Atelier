import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  CreditCard,
  DollarSign,
  Eye,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Clock,
  Sparkles,
  Database,
  Building,
} from "lucide-react";
import { adminOverviewQuery, adminActivityQuery } from "@/lib/admin-api";
import { money, shortDate } from "@/lib/format";

export const Route = createFileRoute("/admin/")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(adminOverviewQuery),
      context.queryClient.ensureQueryData(adminActivityQuery),
    ]),
  head: () => ({
    meta: [{ title: "Platform Overview — Atelier Owner Admin" }],
  }),
  component: AdminOverviewPage,
});

export function AdminOverviewPage() {
  const { data: stats } = useQuery(adminOverviewQuery);
  const { data: activity = [] } = useQuery(adminActivityQuery);

  const metrics = [
    {
      id: "visitors",
      label: "Total Visitors",
      value:
        stats?.totalVisitors !== null && stats?.totalVisitors !== undefined
          ? stats.totalVisitors.toLocaleString()
          : null,
      emptyState: "Analytics pipeline unconfigured",
      sub: "30-day unique web visits",
      icon: Eye,
      href: "/admin/analytics",
    },
    {
      id: "registered",
      label: "Registered Users",
      value: (stats?.registeredUsers ?? 0).toLocaleString(),
      sub: `${stats?.totalBusinesses ?? 0} active atelier accounts`,
      icon: Users,
      href: "/admin/users",
    },
    {
      id: "active",
      label: "Active Users",
      value: (stats?.activeUsers ?? 0).toLocaleString(),
      sub: "Active in last 30 days",
      icon: UserCheck,
      href: "/admin/users",
    },
    {
      id: "free",
      label: "Free Users",
      value: (stats?.freeUsers ?? 0).toLocaleString(),
      sub: "Standard tier ateliers",
      icon: Building,
      href: "/admin/subscriptions",
    },
    {
      id: "paid",
      label: "Paid Subscribers",
      value: (stats?.paidUsers ?? 0).toLocaleString(),
      sub: stats?.paidUsers
        ? `${stats.paidUsers} active paid SaaS subscriptions`
        : "All on Community Tier",
      icon: CreditCard,
      href: "/admin/subscriptions",
    },
    {
      id: "revenue",
      label: "Gross Processed Volume (GMV)",
      value: money(stats?.monthlyRevenue ?? 0, stats?.currency || "NGN"),
      sub: `SaaS MRR: $${stats?.subscriptionMrr ?? 0}.00/mo`,
      icon: DollarSign,
      href: "/admin/revenue",
    },
  ];

  return (
    <div className="space-y-8 font-sans">
      {/* Top Banner / Breadcrumb & Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500 uppercase tracking-wider">
            <span>Platform Overview</span>
            <span>·</span>
            <span>Live Production Feed</span>
          </div>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900">
            System Operations & Metrics
          </h1>
          <p className="mt-1 text-xs text-slate-500">
            Global tenant activity, user registration pipeline, and financial throughput.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/admin/health"
            className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <ShieldCheck className="size-3.5 text-emerald-600" />
            <span>Health Status</span>
          </Link>
          <Link
            to="/admin/users"
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-slate-800"
          >
            <Users className="size-3.5" />
            <span>Manage Users</span>
          </Link>
        </div>
      </div>

      {/* Section 1: KPI Metrics Grid */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xs font-mono font-medium tracking-wider text-slate-500 uppercase">
            Platform Key Metrics
          </h2>
          <span className="text-xs text-slate-400">Updated in real-time</span>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {metrics.map((m) => (
            <div
              key={m.id}
              className="relative rounded-lg border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{m.label}</span>
                <m.icon className="size-4 text-slate-400" />
              </div>

              <div className="mt-3">
                {m.value !== null ? (
                  <p className="font-mono text-2xl font-semibold tracking-tight text-slate-900">
                    {m.value}
                  </p>
                ) : (
                  <p className="text-xs font-mono text-slate-400 italic">{m.emptyState}</p>
                )}
                <p className="mt-1.5 text-xs text-slate-500">{m.sub}</p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <Link
                  to={m.href}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 hover:text-slate-900"
                >
                  <span>View detail</span>
                  <ArrowUpRight className="size-3" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 2 & 3: Registration Trends & User Activity Trends */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Registration Trends */}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Registration Trends</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                New atelier accounts created across recent cohorts
              </p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
              Live DB
            </span>
          </div>

          <div className="mt-6 flex flex-col items-center justify-center py-10 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500">
              <TrendingUp className="size-5" />
            </div>
            <h4 className="mt-3 text-sm font-medium text-slate-800">
              {stats?.totalBusinesses
                ? `${stats.totalBusinesses} Atelier${stats.totalBusinesses === 1 ? "" : "s"} Onboarded`
                : "No User Registrations Yet"}
            </h4>
            <p className="mt-1 max-w-sm text-xs text-slate-500 leading-relaxed">
              Real-time tenant provisioning records are linked directly to Supabase authentication.
              Historical cohort graphing will populate as more designers register.
            </p>
            <Link
              to="/admin/users"
              className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-slate-900 hover:underline"
            >
              Inspect all registered accounts <ArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>

        {/* User Activity Trends */}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">User Activity Trends</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Orders, payments and client fittings captured
              </p>
            </div>
            <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
              Activity
            </span>
          </div>

          <div className="mt-5 space-y-4">
            <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-blue-500" />
                <div>
                  <p className="text-xs font-medium text-slate-800">Garment Orders</p>
                  <p className="text-[11px] text-slate-500">Total client commissions recorded</p>
                </div>
              </div>
              <span className="font-mono text-sm font-semibold text-slate-900">
                {stats?.totalOrders ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-emerald-500" />
                <div>
                  <p className="text-xs font-medium text-slate-800">Financial Deposits</p>
                  <p className="text-[11px] text-slate-500">Payments collected by tailors</p>
                </div>
              </div>
              <span className="font-mono text-sm font-semibold text-slate-900">
                {stats?.totalPaymentsRecorded ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50/60 p-3">
              <div className="flex items-center gap-3">
                <div className="size-2 rounded-full bg-purple-500" />
                <div>
                  <p className="text-xs font-medium text-slate-800">Subscribed Tiers</p>
                  <p className="text-[11px] text-slate-500">Standard community tier</p>
                </div>
              </div>
              <span className="font-mono text-sm font-semibold text-slate-900">100% Free Tier</span>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Recent Platform Activity */}
      <section className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Recent Platform Activity</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live audit events logged from customer fitting, order updates, and atelier operations
            </p>
          </div>
          <Link
            to="/admin/activity"
            className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
          >
            <span>View all logs</span>
            <ArrowUpRight className="size-3" />
          </Link>
        </div>

        {activity.length === 0 ? (
          <div className="py-12 text-center">
            <Clock className="mx-auto size-6 text-slate-400" />
            <p className="mt-2 text-xs font-medium text-slate-700">No activity recorded yet</p>
            <p className="mt-0.5 text-xs text-slate-400">
              When designers log orders, appointments, or status changes, they will stream here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {activity.slice(0, 8).map((log) => (
              <div
                key={log.id}
                className="flex flex-col gap-1 py-3 text-xs sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-1 size-1.5 rounded-full bg-slate-400" />
                  <div>
                    <span className="font-medium text-slate-900">{log.summary}</span>
                    <span className="ml-2 text-slate-400">({log.businessName})</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-400 pl-4 sm:pl-0 font-mono text-[11px]">
                  <span>{shortDate(log.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
