import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, ArrowDownRight, Wallet, TrendingUp } from "lucide-react";
import { adminOverviewQuery } from "@/lib/admin-api";
import { money } from "@/lib/format";

export const Route = createFileRoute("/admin/revenue")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminOverviewQuery),
  head: () => ({ meta: [{ title: "Revenue Intelligence — Atelier Admin" }] }),
  component: AdminRevenuePage,
});

export function AdminRevenuePage() {
  const { data: stats } = useQuery(adminOverviewQuery);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Platform Revenue & Processing
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gross merchandise volume (GMV) and platform SaaS subscription revenues.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <span className="text-xs font-medium text-slate-500">Gross Processed Volume (GMV)</span>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">
            {money(stats?.monthlyRevenue ?? 0, stats?.currency || "NGN")}
          </p>
          <p className="mt-1 text-xs text-slate-400">Total customer payments logged</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <span className="text-xs font-medium text-slate-500">Platform SaaS MRR</span>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">$0.00</p>
          <p className="mt-1 text-xs text-slate-400">All ateliers on Community Tier</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <span className="text-xs font-medium text-slate-500">Processing Fees Collected</span>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">$0.00</p>
          <p className="mt-1 text-xs text-slate-400">Direct payment logging (0% platform cut)</p>
        </div>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <h3 className="text-sm font-semibold text-slate-900">Monetization Architecture Roadmap</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
          In Phase 2, Atelier can monetize via either monthly SaaS subscription tiers (Stripe
          Billing) or an integrated checkout fee on invoices (Stripe Connect / Paystack Split
          Payments).
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded border border-slate-100 bg-slate-50/50 p-4">
            <h4 className="text-xs font-semibold text-slate-800">
              Model A: SaaS Subscription Billing
            </h4>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              Charge designers $29/mo or $99/mo for advanced features, unlimited lookbooks, and team
              cutter accounts.
            </p>
          </div>
          <div className="rounded border border-slate-100 bg-slate-50/50 p-4">
            <h4 className="text-xs font-semibold text-slate-800">
              Model B: Payment Processing Split
            </h4>
            <p className="mt-1 text-[11px] text-slate-500 leading-relaxed">
              Facilitate client deposit payments via hosted links with a 1.5% platform transaction
              fee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
