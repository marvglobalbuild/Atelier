import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CreditCard,
  Check,
  AlertCircle,
  Copy,
  CheckCircle2,
  Building2,
  Sparkles,
  DollarSign,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import {
  adminOverviewQuery,
  adminUsersQuery,
  saveTenantOverride,
  SubscriptionTier,
} from "@/lib/admin-api";
import { money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/subscriptions")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(adminOverviewQuery),
      context.queryClient.ensureQueryData(adminUsersQuery),
    ]),
  head: () => ({ meta: [{ title: "Subscriptions & Plans — Atelier Admin" }] }),
  component: AdminSubscriptionsPage,
});

export function AdminSubscriptionsPage() {
  const queryClient = useQueryClient();
  const { data: stats } = useQuery(adminOverviewQuery);
  const { data: users = [] } = useQuery(adminUsersQuery);
  const [copiedWebhook, setCopiedWebhook] = useState(false);

  const freeCount = users.filter((u) => u.tier === "free").length;
  const proCount = users.filter((u) => u.tier === "pro").length;
  const enterpriseCount = users.filter((u) => u.tier === "enterprise").length;

  const mrr = proCount * 29 + enterpriseCount * 99;
  const arr = mrr * 12;

  const plans = [
    {
      id: "free" as SubscriptionTier,
      name: "Community Atelier",
      price: "$0",
      interval: "Forever Free",
      description: "Basic order tracking, client measurement profiles, and lookbook styling.",
      features: [
        "Up to 25 Active Orders",
        "Unlimited Client Measurement Sets",
        "Style Inspiration Lookbook",
        "Standard Fitting Calendar",
      ],
      activeCount: freeCount,
      status: "Default Tier for New Signups",
    },
    {
      id: "pro" as SubscriptionTier,
      name: "Maison Studio",
      price: "$29",
      interval: "/ month",
      description:
        "High-volume bespoke atelier workflow, client WhatsApp notifications, and ledger accounting.",
      features: [
        "Unlimited Orders & Garment Tracking",
        "WhatsApp / SMS Fitting Notifications",
        "Balance Invoices & Payment Receipts",
        "Fabric Inventory & Yardage Accounting",
        "Priority Support",
      ],
      activeCount: proCount,
      status: "Professional Tier ($29/mo)",
    },
    {
      id: "enterprise" as SubscriptionTier,
      name: "Fashion House",
      price: "$99",
      interval: "/ month",
      description:
        "Multi-location studios, cutter/tailor role assignments, and platform audit compliance.",
      features: [
        "Multiple Studio Locations & Cutters",
        "Granular Staff Role Permissions",
        "Custom Domain & VIP Lookbook Portals",
        "Dedicated Account Management",
        "Custom Data Export & Compliance SLA",
      ],
      activeCount: enterpriseCount,
      status: "Enterprise Tier ($99/mo)",
    },
  ];

  const handleUpdateTenantTier = (businessId: string, tier: SubscriptionTier, name: string) => {
    saveTenantOverride(businessId, { tier });
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    toast.success(`Updated ${name} to ${tier.toUpperCase()}`);
  };

  const handleCopyWebhook = () => {
    const webhookUrl = `${window.location.origin}/api/webhooks/stripe`;
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    toast.success("Stripe webhook endpoint copied to clipboard");
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Subscription & Billing Plans
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure pricing tiers, manage subscriber access control, and review platform MRR.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-slate-200 bg-white px-3 py-1.5 shadow-sm text-xs">
            <span className="text-slate-400">MRR:</span>{" "}
            <span className="font-mono font-semibold text-slate-900">${mrr}.00</span>
            <span className="text-slate-400 ml-2">ARR:</span>{" "}
            <span className="font-mono font-semibold text-slate-900">${arr}.00</span>
          </div>
        </div>
      </div>

      {/* Revenue Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500">Monthly Recurring Revenue</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">
              ${mrr}.00
            </span>
            <span className="text-xs text-slate-400 font-mono">/ mo</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {proCount + enterpriseCount} paid active subscribers
          </p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500">Annual Run-Rate (ARR)</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">
              ${arr}.00
            </span>
            <span className="text-xs text-slate-400 font-mono">/ yr</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">Projected 12-month platform SaaS yield</p>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <span className="text-xs text-slate-500">Free Tier Conversion Rate</span>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">
              {users.length > 0
                ? `${Math.round(((proCount + enterpriseCount) / users.length) * 100)}%`
                : "0%"}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">{freeCount} ateliers on Community Tier</p>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{p.name}</h3>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-medium text-slate-700">
                  {p.activeCount} Ateliers
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{p.description}</p>

              <div className="mt-4 flex items-baseline gap-1">
                <span className="font-mono text-2xl font-bold tracking-tight text-slate-900">
                  {p.price}
                </span>
                <span className="text-xs text-slate-400">{p.interval}</span>
              </div>

              <div className="mt-5 border-t border-slate-100 pt-4">
                <p className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-2">
                  Plan Entitlements
                </p>
                <ul className="space-y-2 text-xs text-slate-600">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2">
                      <Check className="size-3.5 text-slate-400 shrink-0" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-slate-100 text-[11px] font-mono text-slate-400">
              {p.status}
            </div>
          </div>
        ))}
      </div>

      {/* Tenant Plan Assignment Table */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Tenant Subscription Assignment</h3>
            <p className="text-xs text-slate-500">
              Assign or upgrade atelier tiers directly from the owner console
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">{users.length} Active Workspaces</span>
        </div>

        {users.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            No registered workspaces found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Atelier / Workspace</th>
                  <th className="py-2.5 px-3 font-medium">Owner</th>
                  <th className="py-2.5 px-3 font-medium">Current Tier</th>
                  <th className="py-2.5 px-3 font-medium text-right">Assign Tier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 font-medium text-slate-900 flex items-center gap-2">
                      <Building2 className="size-3.5 text-slate-400" />
                      <span>{u.businessName || "Unnamed Atelier"}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{u.ownerName || "—"}</td>
                    <td className="py-2.5 px-3">
                      {u.tier === "enterprise" ? (
                        <span className="rounded bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 border border-purple-200">
                          Fashion House ($99)
                        </span>
                      ) : u.tier === "pro" ? (
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                          Maison Studio ($29)
                        </span>
                      ) : (
                        <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          Community Free ($0)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <select
                        value={u.tier}
                        onChange={(e) =>
                          handleUpdateTenantTier(
                            u.id,
                            e.target.value as SubscriptionTier,
                            u.businessName || "Atelier",
                          )
                        }
                        className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 shadow-sm focus:outline-none"
                      >
                        <option value="free">Community (Free)</option>
                        <option value="pro">Maison Studio ($29/mo)</option>
                        <option value="enterprise">Fashion House ($99/mo)</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Gateway & Webhook Infrastructure Card */}
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="rounded border border-slate-200 bg-slate-50 p-2 text-slate-700">
            <CreditCard className="size-4" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-slate-900">
              Payment Gateway & Webhook Dispatch
            </h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-2xl">
              Atelier supports automated subscription sync via Stripe Billing and Paystack. To
              activate automatic tier provisioning when clients pay their invoices, register the
              webhook endpoint below in your Stripe Dashboard.
            </p>

            <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 max-w-xl">
              <code className="flex-1 rounded border border-slate-200 bg-slate-50 px-3 py-1.5 font-mono text-xs text-slate-800 select-all">
                {typeof window !== "undefined"
                  ? `${window.location.origin}/api/webhooks/stripe`
                  : "/api/webhooks/stripe"}
              </code>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopyWebhook}
                className="h-8 text-xs gap-1.5 border-slate-200 shrink-0"
              >
                {copiedWebhook ? (
                  <CheckCircle2 className="size-3.5 text-emerald-600" />
                ) : (
                  <Copy className="size-3.5 text-slate-500" />
                )}
                <span>{copiedWebhook ? "Copied" : "Copy Endpoint"}</span>
              </Button>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-mono text-slate-500">
              <span className="rounded bg-slate-100 px-2 py-0.5">checkout.session.completed</span>
              <span className="rounded bg-slate-100 px-2 py-0.5">
                customer.subscription.updated
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5">
                customer.subscription.deleted
              </span>
              <span className="rounded bg-slate-100 px-2 py-0.5">invoice.payment_succeeded</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
