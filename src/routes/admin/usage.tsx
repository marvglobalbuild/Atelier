import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Activity, Scissors, Ruler, Users, Images, Calendar } from "lucide-react";
import { adminOverviewQuery } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/usage")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminOverviewQuery),
  head: () => ({ meta: [{ title: "Product Usage — Atelier Admin" }] }),
  component: AdminUsagePage,
});

export function AdminUsagePage() {
  const { data: stats } = useQuery(adminOverviewQuery);

  const usageCards = [
    {
      title: "Garment Commissions",
      count: stats?.totalOrders ?? 0,
      sub: "Orders placed across ateliers",
      icon: Scissors,
      metric: "Orders",
    },
    {
      title: "Active Ateliers",
      count: stats?.totalBusinesses ?? 0,
      sub: "Registered fashion houses",
      icon: Users,
      metric: "Tenants",
    },
    {
      title: "Financial Transactions",
      count: stats?.totalPaymentsRecorded ?? 0,
      sub: "Deposit & final payments",
      icon: Activity,
      metric: "Payments",
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Product & Feature Usage
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real usage metrics across core functional modules of the Atelier platform.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {usageCards.map((c) => (
          <div key={c.title} className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">{c.title}</span>
              <c.icon className="size-4 text-slate-400" />
            </div>
            <p className="mt-3 font-mono text-2xl font-semibold text-slate-900">
              {c.count.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-slate-900">Tenant Resource Utilization</h3>
        <p className="text-xs text-slate-500 mt-0.5">
          Database storage and asset allocation per tenant
        </p>

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
            <span className="text-slate-600">PostgreSQL Database Rows</span>
            <span className="font-mono font-medium text-slate-900">
              {(
                (stats?.totalOrders ?? 0) +
                (stats?.totalBusinesses ?? 0) +
                (stats?.totalPaymentsRecorded ?? 0)
              ).toLocaleString()}{" "}
              records
            </span>
          </div>
          <div className="flex items-center justify-between border-b border-slate-100 pb-2 text-xs">
            <span className="text-slate-600">Storage Bucket Asset Allocation</span>
            <span className="font-mono font-medium text-slate-900">Supabase Storage</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600">Edge Function Executions</span>
            <span className="font-mono font-medium text-slate-900">0 / Unlimited</span>
          </div>
        </div>
      </div>
    </div>
  );
}
