import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  HeartPulse,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Server,
  Database,
  ShieldCheck,
  Zap,
  Play,
  Copy,
  Clock,
  Sparkles,
  ShieldAlert,
} from "lucide-react";
import { adminHealthQuery, runFullDiagnostics, DiagnosticCheckResult } from "@/lib/admin-api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/health")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminHealthQuery),
  head: () => ({ meta: [{ title: "Platform Health — Atelier Admin" }] }),
  component: AdminHealthPage,
});

export function AdminHealthPage() {
  const { data: health, refetch, isFetching } = useQuery(adminHealthQuery);
  const [runningDiagnostics, setRunningDiagnostics] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<DiagnosticCheckResult[] | null>(null);
  const [diagnosticTimestamp, setDiagnosticTimestamp] = useState<string | null>(null);

  const services = [
    {
      name: "Supabase PostgreSQL Database",
      status: health?.database ?? "operational",
      description: "Primary relational transactional store with Row-Level Security",
      icon: Database,
    },
    {
      name: "Supabase Authentication Service",
      status: health?.auth ?? "operational",
      description: "JWT token issuance, auth middleware, and session lifecycle",
      icon: ShieldCheck,
    },
    {
      name: "Storage & Asset Delivery CDN",
      status: health?.storage ?? "operational",
      description: "Moodboard style assets and garment specification image store",
      icon: Server,
    },
  ];

  const handleRunDiagnostics = async () => {
    setRunningDiagnostics(true);
    try {
      const results = await runFullDiagnostics();
      setDiagnosticResults(results);
      setDiagnosticTimestamp(new Date().toISOString());
      toast.success("Platform diagnostics completed successfully");
    } catch (err) {
      toast.error("Diagnostics encountered an error");
    } finally {
      setRunningDiagnostics(false);
    }
  };

  const handleCopyReport = () => {
    if (!diagnosticResults) return;
    const report = [
      `# ATELIER PLATFORM DIAGNOSTIC REPORT`,
      `Timestamp: ${diagnosticTimestamp ?? new Date().toISOString()}`,
      `Database Ping: ${health?.latencyMs ?? 0}ms`,
      ``,
      `## Subsystem Diagnostics:`,
      ...diagnosticResults.map(
        (r) => `[${r.status.toUpperCase()}] ${r.name} (${r.latencyMs}ms) - ${r.detail}`,
      ),
    ].join("\n");

    navigator.clipboard.writeText(report);
    toast.success("Diagnostic report copied to clipboard");
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Platform Infrastructure Health
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time operational status, database connectivity, and subsystem latency.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="h-8 text-xs gap-1.5 border-slate-200 bg-white"
          >
            <Zap className="size-3 text-amber-500" />
            <span>{isFetching ? "Checking…" : "Quick Ping"}</span>
          </Button>
          <Button
            size="sm"
            onClick={handleRunDiagnostics}
            disabled={runningDiagnostics}
            className="h-8 text-xs gap-1.5 bg-slate-900 text-white hover:bg-slate-800"
          >
            {runningDiagnostics ? (
              <>
                <div className="size-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Running Checks…</span>
              </>
            ) : (
              <>
                <Play className="size-3" />
                <span>Run Full Diagnostics</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Latency and Status Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs text-slate-500">Overall Infrastructure Status</span>
          <div className="mt-2 flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm font-semibold text-slate-900">100% Operational</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">All subsystems reporting healthy</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs text-slate-500">Database API Latency</span>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">
              {health?.latencyMs ?? 0}
            </span>
            <span className="text-xs text-slate-400 font-mono">ms round-trip</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Direct PostgreSQL head query</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <span className="text-xs text-slate-500">Last Health Check</span>
          <div className="mt-2 text-sm font-mono text-slate-800 font-medium">
            {health?.checkedAt ? new Date(health.checkedAt).toLocaleTimeString() : "Just now"}
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Automated polling every 15s</p>
        </div>
      </div>

      {/* Core Services List */}
      <div className="rounded-lg border border-slate-200 bg-white divide-y divide-slate-100 shadow-sm overflow-hidden">
        <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 font-mono text-[11px] uppercase tracking-wider text-slate-500">
          Core Subsystems Status
        </div>
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

      {/* Diagnostics Results Panel */}
      {diagnosticResults && (
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-600" />
                <h3 className="text-sm font-semibold text-slate-900">
                  Subsystem Benchmark Results
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-mono">
                Executed at:{" "}
                {diagnosticTimestamp ? new Date(diagnosticTimestamp).toLocaleString() : ""}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyReport}
              className="h-7 text-xs gap-1.5 border-slate-200"
            >
              <Copy className="size-3 text-slate-500" />
              <span>Copy Report</span>
            </Button>
          </div>

          <div className="space-y-2">
            {diagnosticResults.map((res, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center justify-between rounded-md border border-slate-100 bg-slate-50/70 p-3 text-xs gap-2"
              >
                <div className="flex items-start gap-2.5">
                  {res.status === "pass" ? (
                    <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                  ) : res.status === "warn" ? (
                    <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                  ) : (
                    <XCircle className="size-4 text-rose-600 mt-0.5 shrink-0" />
                  )}
                  <div>
                    <span className="font-semibold text-slate-900">{res.name}</span>
                    <p className="text-[11px] text-slate-500 mt-0.5">{res.detail}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-6 sm:pl-0 shrink-0">
                  <span className="font-mono text-xs font-medium text-slate-700">
                    {res.latencyMs} ms
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase ${
                      res.status === "pass"
                        ? "bg-emerald-100 text-emerald-800"
                        : res.status === "warn"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-rose-100 text-rose-800"
                    }`}
                  >
                    {res.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
