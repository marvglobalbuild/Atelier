import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Globe,
  Users,
  Compass,
  PieChart,
  Calendar,
  Layers,
  Sparkles,
} from "lucide-react";
import { adminOverviewQuery, adminUsersQuery } from "@/lib/admin-api";
import { shortDate } from "@/lib/format";

export const Route = createFileRoute("/admin/analytics")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(adminOverviewQuery),
      context.queryClient.ensureQueryData(adminUsersQuery),
    ]),
  head: () => ({ meta: [{ title: "Platform Analytics — Atelier Admin" }] }),
  component: AdminAnalyticsPage,
});

export function AdminAnalyticsPage() {
  const { data: stats } = useQuery(adminOverviewQuery);
  const { data: users = [] } = useQuery(adminUsersQuery);

  // Group registrations by month
  const monthlyCohorts: Record<string, number> = {};
  users.forEach((u) => {
    const d = new Date(u.createdAt);
    const key = `${d.toLocaleString("default", { month: "short" })} ${d.getFullYear()}`;
    monthlyCohorts[key] = (monthlyCohorts[key] || 0) + 1;
  });

  const cohortEntries = Object.entries(monthlyCohorts);
  const maxCohortCount = Math.max(...cohortEntries.map(([, count]) => count), 1);

  // Currency breakdown
  const currencyCounts: Record<string, number> = {};
  users.forEach((u) => {
    currencyCounts[u.currency] = (currencyCounts[u.currency] || 0) + 1;
  });

  // Unit breakdown
  const unitCounts: Record<string, number> = {};
  users.forEach((u) => {
    unitCounts[u.measurementUnit] = (unitCounts[u.measurementUnit] || 0) + 1;
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Platform Analytics & Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Tenant cohort adoption, geographic currency splits, and privacy-first telemetry.
          </p>
        </div>
      </div>

      {/* Cohort Adoption Chart */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Atelier Onboarding Cohort Growth
            </h3>
            <p className="text-xs text-slate-500">
              New workspace signups grouped by registration timeline
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">{users.length} Total Registered</span>
        </div>

        {cohortEntries.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No atelier registrations recorded yet.
          </div>
        ) : (
          <div className="pt-4 space-y-4">
            <div className="flex items-end gap-6 h-40 border-b border-slate-100 px-4 pb-2">
              {cohortEntries.map(([month, count]) => {
                const heightPercent = Math.max(Math.round((count / maxCohortCount) * 100), 15);
                return (
                  <div key={month} className="flex flex-col items-center gap-2 flex-1 max-w-[80px]">
                    <span className="text-[11px] font-mono text-slate-700 font-medium">
                      {count}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full rounded-t bg-slate-900 transition-all hover:bg-slate-700"
                    />
                    <span className="text-[10px] font-mono text-slate-400 truncate w-full text-center">
                      {month}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Distribution Grids */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {/* Currency Preferences */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <PieChart className="size-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Currency Distribution</h3>
          </div>
          {Object.keys(currencyCounts).length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No data available</p>
          ) : (
            <div className="space-y-2 pt-1">
              {Object.entries(currencyCounts).map(([cur, count]) => (
                <div key={cur} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-700">{cur}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-800 rounded-full"
                        style={{
                          width: `${Math.round((count / users.length) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-slate-500 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Measurement Unit Preferences */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
            <Compass className="size-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Measurement Unit Standards</h3>
          </div>
          {Object.keys(unitCounts).length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">No data available</p>
          ) : (
            <div className="space-y-2 pt-1">
              {Object.entries(unitCounts).map(([unit, count]) => (
                <div key={unit} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-700 capitalize">
                    {unit === "in" ? "Inches (in)" : unit === "cm" ? "Centimeters (cm)" : unit}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-800 rounded-full"
                        style={{
                          width: `${Math.round((count / users.length) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="font-mono text-slate-500 w-8 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Visitor Telemetry Pipeline Status */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded border border-slate-200 bg-slate-50 p-2 text-slate-600">
            <Globe className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">
              Privacy-First Visitor Analytics Pipeline
            </h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-2xl">
              Atelier complies with GDPR and global privacy standards by relying strictly on
              cookieless web telemetry. The Vercel Web Analytics pipeline is configured and ready to
              stream live visitor sessions upon custom domain verification.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-mono text-slate-500">
              <span className="rounded bg-slate-100 px-2 py-0.5">Cookieless Tracking</span>
              <span className="rounded bg-slate-100 px-2 py-0.5">GDPR / CCPA Compliant</span>
              <span className="rounded bg-slate-100 px-2 py-0.5">Vercel Web Analytics Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
