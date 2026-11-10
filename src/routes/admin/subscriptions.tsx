import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, Check, AlertCircle, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/admin/subscriptions")({
  head: () => ({ meta: [{ title: "Subscriptions & Plans — Atelier Admin" }] }),
  component: AdminSubscriptionsPage,
});

export function AdminSubscriptionsPage() {
  const plans = [
    {
      id: "free",
      name: "Community Atelier",
      price: "Free",
      interval: "Forever",
      description: "Basic order tracking, manual measurement profiles and lookbook.",
      features: [
        "Up to 25 Active Orders",
        "Unlimited Measurement Sets",
        "Lookbook & Style Assets",
        "Standard Fittings Calendar",
      ],
      activeCount: 1,
      status: "Active default tier",
    },
    {
      id: "pro",
      name: "Maison Studio",
      price: "$29",
      interval: "/ month",
      description:
        "Advanced fashion operations, WhatsApp fitting reminders, multi-currency balance ledgers.",
      features: [
        "Unlimited Orders & Clients",
        "WhatsApp & SMS Client Notifications",
        "Financial Balance Ledgers & PDF Invoices",
        "Fabric Yardage Inventory",
      ],
      activeCount: 0,
      status: "Configured (Awaiting Stripe Gateway)",
    },
    {
      id: "enterprise",
      name: "Fashion House",
      price: "$99",
      interval: "/ month",
      description: "Multiple branch studios, team cutter/tailor assignments and audit security.",
      features: [
        "Multiple Studio Locations",
        "Tailor / Cutter Role Permissions",
        "Custom Domain & Lookbook Portals",
        "Dedicated VIP Support",
      ],
      activeCount: 0,
      status: "Enterprise tier",
    },
  ];

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Subscription & Billing Plans
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure pricing tiers, billing cycles, and subscriber access control.
          </p>
        </div>
      </div>

      {/* Integration Notice / Empty state */}
      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <div className="flex items-start gap-3">
          <div className="rounded border border-amber-200 bg-amber-50 p-2 text-amber-700">
            <AlertCircle className="size-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">Payment Gateway Pipeline</h3>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed max-w-2xl">
              Stripe or Paystack subscription webhooks are not yet connected. All currently
              registered ateliers are provisioned on the default Community Atelier tier. When
              billing credentials are configured in Phase 2, automated tier enforcement and
              subscription webhooks will stream here.
            </p>
          </div>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((p) => (
          <div
            key={p.id}
            className="rounded-lg border border-slate-200 bg-white p-5 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-900">{p.name}</h3>
                <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-mono text-slate-600">
                  {p.activeCount} Subscribed
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500 leading-relaxed">{p.description}</p>

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
    </div>
  );
}
