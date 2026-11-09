import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { activityQuery, ordersQuery, paymentsQuery, useBusiness } from "@/lib/api";
import {
  ACTIVE_STATUSES,
  PRODUCTION_STAGES,
  STATUS_LABEL,
  isOverdue,
  paymentSummary,
} from "@/lib/domain";
import { money, shortDate, longDate, isoDay } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { OrderDialog } from "@/components/app/dialogs";
import { Panel, PayBadge, StatusBadge, Empty } from "@/components/app/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(ordersQuery),
      context.queryClient.ensureQueryData(paymentsQuery),
      context.queryClient.ensureQueryData(activityQuery),
    ]),
  head: () => ({ meta: [{ title: "Dashboard — Atelier" }] }),
  component: Dashboard,
});

const RANGES = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  month: "This month",
  all: "All time",
} as const;
type Range = keyof typeof RANGES;

function rangeStart(r: Range): string | null {
  const d = new Date();
  if (r === "7d") d.setDate(d.getDate() - 6);
  else if (r === "30d") d.setDate(d.getDate() - 29);
  else if (r === "month") d.setDate(1);
  else return null;
  return isoDay(d);
}

function Dashboard() {
  const b = useBusiness();
  const navigate = useNavigate();
  const { data: orders } = useSuspenseQuery(ordersQuery);
  const { data: payments } = useSuspenseQuery(paymentsQuery);
  const { data: activity } = useSuspenseQuery(activityQuery);
  const [range, setRange] = useState<Range>("month");
  const [newOrder, setNewOrder] = useState(false);

  const s = useMemo(() => {
    const start = rangeStart(range);
    const active = orders.filter((o) => ACTIVE_STATUSES.includes(o.status));
    const overdue = active.filter((o) => isOverdue(o.due_date, o.status));
    const received = payments
      .filter((p) => !start || p.paid_on >= start)
      .reduce((t, p) => t + Number(p.amount), 0);
    const withBal = orders
      .filter((o) => o.status !== "cancelled")
      .map((o) => ({ o, ...paymentSummary(Number(o.price), o.payments) }));
    const outstanding = withBal.reduce((t, x) => t + Math.max(x.balance, 0), 0);
    const in7 = isoDay(new Date(Date.now() + 7 * 864e5));
    const attention = active
      .filter(
        (o) =>
          isOverdue(o.due_date, o.status) ||
          (o.due_date && o.due_date <= in7) ||
          o.status === "ready",
      )
      .slice(0, 6);
    const upcoming = active
      .filter((o) => o.due_date && o.due_date >= isoDay(new Date()))
      .slice(0, 6);
    const stageCounts = PRODUCTION_STAGES.map((st) => ({
      st,
      n: active.filter((o) => o.status === st).length,
    }));
    return {
      active,
      overdue,
      received,
      outstanding,
      attention,
      upcoming,
      stageCounts,
      unpaidCount: withBal.filter((x) => x.status === "unpaid" || x.status === "partial").length,
    };
  }, [orders, payments, range]);

  const hour = new Date().getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const first = b.owner_name.split(" ")[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString("en-GB", {
              weekday: "long",
              day: "numeric",
              month: "long",
            })}{" "}
            · {b.name}
          </p>
          <h1 className="font-display mt-1 text-3xl sm:text-4xl">
            {greet}, {first}
          </h1>
        </div>
        <div className="flex gap-2">
          <select
            aria-label="Date range"
            value={range}
            onChange={(e) => setRange(e.target.value as Range)}
            className="h-9 rounded-md border border-input bg-card px-2.5 text-sm"
          >
            {Object.entries(RANGES).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
          <Button variant="hero" onClick={() => setNewOrder(true)}>
            <Plus />
            New order
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border lg:grid-cols-4">
        {[
          {
            k: "Active orders",
            v: String(s.active.length),
            go: () => navigate({ to: "/orders", search: { filter: "active" } }),
          },
          {
            k: "Overdue deliveries",
            v: String(s.overdue.length),
            go: () => navigate({ to: "/orders", search: { filter: "overdue" } }),
            warn: s.overdue.length > 0,
          },
          {
            k: `Received · ${RANGES[range].toLowerCase()}`,
            v: money(s.received, b.currency),
            go: () =>
              navigate({
                to: "/payments",
                search: { status: undefined, from: rangeStart(range) ?? undefined },
              }),
          },
          {
            k: "Outstanding balance",
            v: money(s.outstanding, b.currency),
            go: () => navigate({ to: "/payments", search: { status: "owing", from: undefined } }),
          },
        ].map((m) => (
          <button
            key={m.k}
            onClick={m.go}
            className="group bg-card p-4 text-left transition-colors hover:bg-secondary/40"
          >
            <p className="text-xs text-muted-foreground">{m.k}</p>
            <p
              className={cn(
                "tabular mt-1.5 break-words text-xl font-semibold",
                m.warn && "text-destructive",
              )}
            >
              {m.v}
            </p>
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Panel
          title="Orders requiring attention"
          action={
            <Link to="/orders" search={{ filter: undefined }} className="text-xs text-primary">
              All orders
            </Link>
          }
        >
          {s.attention.length === 0 ? (
            <div className="p-6">
              <Empty
                title="All calm"
                body="Nothing overdue or due in the next week."
                action={
                  orders.length === 0 ? (
                    <Button variant="ink" onClick={() => setNewOrder(true)}>
                      Create your first order
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="divide-y divide-border">
              {s.attention.map((o) => {
                const ps = paymentSummary(Number(o.price), o.payments);
                const od = isOverdue(o.due_date, o.status);
                return (
                  <Link
                    key={o.id}
                    to="/orders/$id"
                    params={{ id: o.id }}
                    className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 transition-colors hover:bg-secondary/40 sm:grid-cols-[1.4fr_auto_auto_auto]"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{o.outfit_name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {o.customers?.full_name}
                      </p>
                    </div>
                    <StatusBadge status={o.status} />
                    <span
                      className={cn(
                        "text-xs",
                        od ? "font-medium text-destructive" : "text-muted-foreground",
                      )}
                    >
                      {od ? "Overdue · " : "Due "}
                      {shortDate(o.due_date)}
                    </span>
                    <span className="text-right">
                      <PayBadge status={ps.status} />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Panel>
        <Panel title="Production overview">
          <div className="space-y-1 p-3">
            {s.stageCounts.map(({ st, n }) => (
              <Link
                key={st}
                to="/orders"
                search={{ filter: st }}
                className="block rounded-md px-2 py-2 transition-colors hover:bg-secondary/50"
              >
                <div className="flex justify-between text-sm">
                  <span>{STATUS_LABEL[st]}</span>
                  <span className="tabular text-muted-foreground">{n}</span>
                </div>
                <div className="mt-1.5 h-1.5 rounded-full bg-secondary">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${s.active.length ? (n / s.active.length) * 100 : 0}%` }}
                  />
                </div>
              </Link>
            ))}
          </div>
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel
          title="Upcoming deliveries"
          action={
            <Link to="/calendar" className="text-xs text-primary">
              Calendar
            </Link>
          }
        >
          {s.upcoming.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No upcoming deliveries.</p>
          ) : (
            <ol className="divide-y divide-border">
              {s.upcoming.map((o) => (
                <li key={o.id}>
                  <Link
                    to="/orders/$id"
                    params={{ id: o.id }}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-secondary/40"
                  >
                    <span className="w-12 shrink-0 text-center">
                      <span className="block text-[10px] uppercase text-muted-foreground">
                        {new Date(o.due_date + "T00:00").toLocaleDateString("en-GB", {
                          month: "short",
                        })}
                      </span>
                      <span className="font-display text-xl">
                        {new Date(o.due_date + "T00:00").getDate()}
                      </span>
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm">{o.outfit_name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {o.customers?.full_name}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Panel>
        <Panel
          title="Financial summary"
          action={
            <Link
              to="/payments"
              search={{ status: undefined, from: undefined }}
              className="text-xs text-primary"
            >
              Transactions
            </Link>
          }
        >
          <div className="space-y-4 p-4">
            <div>
              <p className="text-xs text-muted-foreground">
                Received ({RANGES[range].toLowerCase()})
              </p>
              <p className="tabular mt-1 text-lg font-semibold text-success">
                {money(s.received, b.currency)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Outstanding across {s.unpaidCount} orders
              </p>
              <p className="tabular mt-1 text-lg font-semibold">
                {money(s.outstanding, b.currency)}
              </p>
            </div>
            <div className="border-t border-border pt-3">
              {payments.slice(0, 4).map((p) => (
                <div key={p.id} className="flex justify-between py-1.5 text-sm">
                  <span className="truncate text-muted-foreground">{p.orders?.outfit_name}</span>
                  <span className="tabular shrink-0 pl-2">
                    {money(Number(p.amount), b.currency)}
                  </span>
                </div>
              ))}
              {payments.length === 0 && (
                <p className="text-sm text-muted-foreground">No payments yet.</p>
              )}
            </div>
          </div>
        </Panel>
        <Panel title="Recent activity">
          {activity.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Activity will appear as you work.</p>
          ) : (
            <ol className="space-y-0 p-4">
              {activity.map((a) => (
                <li key={a.id} className="relative border-l border-border pb-4 pl-4 last:pb-0">
                  <span className="absolute -left-[3.5px] top-1.5 size-1.5 rounded-full bg-primary" />
                  <p className="text-sm">{a.summary}</p>
                  <p className="text-xs text-muted-foreground">{longDate(a.created_at)}</p>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
      <OrderDialog
        open={newOrder}
        onOpenChange={setNewOrder}
        onSaved={(id) => navigate({ to: "/orders/$id", params: { id } })}
      />
    </div>
  );
}
