import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Percent,
  Sliders,
  Wallet,
  Building2,
  Sparkles,
} from "lucide-react";
import { adminOverviewQuery, adminUsersQuery } from "@/lib/admin-api";
import { money } from "@/lib/format";
import { Slider } from "@/components/ui/slider";

export const Route = createFileRoute("/admin/revenue")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(adminOverviewQuery),
      context.queryClient.ensureQueryData(adminUsersQuery),
    ]),
  head: () => ({ meta: [{ title: "Revenue Intelligence — Atelier Admin" }] }),
  component: AdminRevenuePage,
});

export function AdminRevenuePage() {
  const { data: stats } = useQuery(adminOverviewQuery);
  const { data: users = [] } = useQuery(adminUsersQuery);

  const proCount = users.filter((u) => u.tier === "pro").length;
  const enterpriseCount = users.filter((u) => u.tier === "enterprise").length;
  const saasMrr = proCount * 29 + enterpriseCount * 99;
  const saasArr = saasMrr * 12;

  const totalGmv = stats?.monthlyRevenue ?? 0;
  const currency = stats?.currency || "NGN";

  // Interactive take-rate slider (default 1.5%)
  const [takeRate, setTakeRate] = useState([1.5]);
  const estimatedPlatformFee = (totalGmv * takeRate[0]) / 100;

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Platform Revenue Intelligence
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gross merchandise volume (GMV), subscription run-rate, and platform monetization models.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Gross Processed Volume (GMV)</span>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">
            {money(totalGmv, currency)}
          </p>
          <p className="mt-1 text-[11px] text-slate-400">
            Total client deposits & invoices recorded
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Platform SaaS MRR</span>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">${saasMrr}.00</p>
          <p className="mt-1 text-[11px] text-slate-400">
            {proCount + enterpriseCount} paid tier subscriptions
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <span className="text-xs font-medium text-slate-500">Annual SaaS Run-Rate (ARR)</span>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">${saasArr}.00</p>
          <p className="mt-1 text-[11px] text-slate-400">
            Projected 12-month platform software fees
          </p>
        </div>
      </div>

      {/* Interactive Take-Rate Revenue Simulator */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <Sliders className="size-4 text-slate-700" />
              <h3 className="text-sm font-semibold text-slate-900">
                Integrated Checkout Fee Simulator
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Project platform revenue if an automatic transaction fee is applied to client invoice
              payments.
            </p>
          </div>
          <span className="font-mono text-sm font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
            {takeRate[0].toFixed(1)}% Platform Fee
          </span>
        </div>

        <div className="space-y-3 max-w-lg">
          <div className="flex justify-between text-xs text-slate-500 font-mono">
            <span>0.5% (Low)</span>
            <span>1.5% (Standard)</span>
            <span>3.0% (High)</span>
          </div>
          <Slider
            value={takeRate}
            onValueChange={setTakeRate}
            min={0.5}
            max={3.0}
            step={0.1}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="rounded-md border border-slate-100 bg-slate-50/80 p-4">
            <span className="text-[11px] font-mono uppercase text-slate-500 block">
              Projected Transaction Revenue
            </span>
            <span className="mt-1 block font-mono text-xl font-bold text-slate-900">
              {money(estimatedPlatformFee, currency)}
            </span>
            <span className="text-[11px] text-slate-500">
              Calculated on recorded GMV of {money(totalGmv, currency)}
            </span>
          </div>

          <div className="rounded-md border border-slate-100 bg-slate-50/80 p-4">
            <span className="text-[11px] font-mono uppercase text-slate-500 block">
              Combined Monthly Yield (SaaS + Take-Rate)
            </span>
            <span className="mt-1 block font-mono text-xl font-bold text-slate-900">
              ${saasMrr}.00 + {money(estimatedPlatformFee, currency)}
            </span>
            <span className="text-[11px] text-slate-500">
              Multi-stream monetization architecture
            </span>
          </div>
        </div>
      </div>

      {/* Monetization Models Roadmap */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900">Platform Monetization Strategy</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-xl leading-relaxed">
          Atelier supports multiple complementary revenue streams for the platform owner:
        </p>

        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2">
              <CreditCard className="size-4 text-slate-600" />
              <h4 className="text-xs font-semibold text-slate-800">1. SaaS Subscriptions</h4>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
              Charge designers $29/mo or $99/mo for team cutter accounts, unlimited lookbooks, and
              custom domains.
            </p>
          </div>

          <div className="rounded border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2">
              <Percent className="size-4 text-slate-600" />
              <h4 className="text-xs font-semibold text-slate-800">2. Checkout Processing Split</h4>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
              Collect 1.0% – 1.5% on all garment deposit links generated through Stripe Connect or
              Paystack Split.
            </p>
          </div>

          <div className="rounded border border-slate-100 bg-slate-50/60 p-4">
            <div className="flex items-center gap-2">
              <Wallet className="size-4 text-slate-600" />
              <h4 className="text-xs font-semibold text-slate-800">3. Hybrid Model</h4>
            </div>
            <p className="mt-1.5 text-[11px] text-slate-500 leading-relaxed">
              Provide free software to community tailors with a 2% fee, while pro subscribers pay
              $29/mo with 0% platform fee.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
