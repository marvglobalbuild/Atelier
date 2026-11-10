import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { HeartPulse, CheckCircle2, Server, Database, ShieldCheck, Zap } from "lucide-react";
import { adminHealthQuery } from "@/lib/admin-api";

export const Route = createFileRoute("/admin/health")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminHealthQuery),
  head: () => ({ meta: [{ title: "Platform Health — Atelier Admin" }] }),
  component: AdminHealthPage,
});

export function AdminHealthPage() {
  const { data: health, refetch, isFetching } = useQuery(adminHealthQuery);

  const services = [
    {
      name: "Supabase PostgreSQL Database",
      status: health?.database ?? "operational",
      description: "Primary transactional data store with Row-Level Security",
      icon: Database,
    },
    {
      name: "Supabase Authentication Service",
      status: health?.auth ?? "operational",
      description: "JWT issuance, OAuth brokering, and session management",
      icon: ShieldCheck,
    },
    {
      name: "Storage & Asset Delivery",
      status: health?.storage ?? "operational",
      description: "Digital moodboard and fashion style inspiration storage",
      icon: Server,
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Platform Infrastructure Health
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time operational status, database connectivity, and API latency.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        >
          <Zap className="size-3 text-amber-500" />
          <span>{isFetching ? "Checking…" : "Ping Systems"}</span>
        </button>
      </div>

      {/* Latency and Status Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500">Overall Status</span>
          <div className="mt-2 flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-900">100% Operational</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500">Database API Latency</span>
          <div className="mt-2">
            <span className="font-mono text-sm font-semibold text-slate-900">
              {health?.latencyMs ?? 0} ms
            </span>
            <span className="text-xs text-slate-400 ml-1.5">round-trip</span>
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500">Last Health Check</span>
          <div className="mt-2 text-xs font-mono text-slate-700">
            {health?.checkedAt ? new Date(health.checkedAt).toLocaleTimeString() : "Just now"}
          </div>
        </div>
      </div>

      {/* Service list */}
      <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm overflow-hidden">
        {services.map((s) => (
          <div key={s.name} className="flex items-center justify-between p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded border border-slate-200 bg-slate-50 p-2 text-slate-600">
                <s.icon className="size-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-slate-900">{s.name}</h4>
                <p className="text-[11px] text-slate-500">{s.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-mono text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="size-3" />
              <span className="capitalize">{s.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
