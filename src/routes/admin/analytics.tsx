import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, LineChart, Users, ArrowUpRight, Globe, Layers } from "lucide-react";

export const Route = createFileRoute("/admin/analytics")({
  head: () => ({ meta: [{ title: "Platform Analytics — Atelier Admin" }] }),
  component: AdminAnalyticsPage,
});

export function AdminAnalyticsPage() {
  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Platform Analytics & Traffic
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Traffic attribution, visitor funnels, and marketing conversion data.
          </p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-8 text-center max-w-2xl mx-auto my-12">
        <div className="flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-600 mx-auto">
          <Globe className="size-6" />
        </div>
        <h2 className="mt-4 text-base font-semibold text-slate-900">
          Visitor Analytics Pipeline Unconfigured
        </h2>
        <p className="mt-2 text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
          To display privacy-first visitor metrics, pageview heatmaps, and funnel drop-off without
          third-party tracking cookies, connect a platform telemetry adapter (e.g., Plausible,
          PostHog, or Vercel Web Analytics).
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono text-slate-600">
            Adapter: Vercel Analytics (Ready)
          </span>
          <span className="rounded border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-mono text-slate-600">
            Cookie Policy: Cookieless
          </span>
        </div>
      </div>
    </div>
  );
}
