import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, X } from "lucide-react";
import {
  demoCollections,
  demoCustomers,
  demoOrders,
  demoStyles,
  type DemoOrder,
} from "@/lib/demo-data";
import {
  ORDER_STATUSES,
  STATUS_LABEL,
  paymentSummary,
  PAYMENT_LABEL,
  stageProgress,
  type OrderStatus,
} from "@/lib/domain";
import { money } from "@/lib/format";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./Reveal";

const tabs = ["Dashboard", "Customers", "Style Library", "Orders", "Payments"] as const;
type Tab = (typeof tabs)[number];

export function ProductDemo() {
  const [tab, setTab] = useState<Tab>("Dashboard");
  const [orders, setOrders] = useState<DemoOrder[]>(demoOrders);

  return (
    <section id="product" className="scroll-mt-20 py-24 md:py-32">
      <div className="mx-auto max-w-7xl px-5 md:px-8">
        <SectionHeading
          eyebrow="Try it here"
          title={
            <>
              Click around. <em>It works.</em>
            </>
          }
          body="A live preview of the real interface, filled with sample records. Nothing you do here is saved."
        />
        <div className="mt-12 overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-float)]">
          <div className="flex items-center justify-between gap-4 border-b border-border px-3 sm:px-4">
            <div
              role="tablist"
              aria-label="Product preview"
              className="-mb-px flex overflow-x-auto"
            >
              {tabs.map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => setTab(t)}
                  className={cn(
                    "relative whitespace-nowrap px-3 py-3.5 text-sm transition-colors sm:px-4",
                    tab === t ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t}
                  {tab === t && (
                    <motion.span
                      layoutId="demo-tab"
                      className="absolute inset-x-2 bottom-0 h-0.5 bg-primary"
                    />
                  )}
                </button>
              ))}
            </div>
            <span className="hidden shrink-0 rounded-sm bg-wine-soft px-2 py-1 text-[11px] font-medium text-primary sm:inline">
              Sample data
            </span>
          </div>
          <div className="min-h-[520px] bg-background/60 p-4 sm:p-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28 }}
              >
                {tab === "Dashboard" && <DemoDashboard orders={orders} go={setTab} />}
                {tab === "Customers" && <DemoCustomers />}
                {tab === "Style Library" && <DemoStyles />}
                {tab === "Orders" && <DemoOrders orders={orders} setOrders={setOrders} />}
                {tab === "Payments" && <DemoPayments orders={orders} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-muted-foreground sm:hidden">
          Sample data · nothing is saved
        </p>
      </div>
    </section>
  );
}

function StatusPill({ status }: { status: OrderStatus }) {
  const tone =
    status === "delivered" || status === "ready"
      ? "bg-success-soft text-success"
      : status === "cancelled"
        ? "bg-danger-soft text-destructive"
        : status === "fitting" || status === "finishing"
          ? "bg-warning-soft text-warning"
          : "bg-secondary text-foreground";
  return (
    <span
      className={cn(
        "inline-flex whitespace-nowrap rounded-sm px-2 py-0.5 text-xs font-medium",
        tone,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function DemoDashboard({ orders, go }: { orders: DemoOrder[]; go: (t: Tab) => void }) {
  const active = orders.filter((o) => o.status !== "delivered" && o.status !== "cancelled");
  const received = orders.reduce((s, o) => s + o.paid, 0);
  const outstanding = orders.reduce((s, o) => s + Math.max(o.price - o.paid, 0), 0);
  const metrics: [string, string, Tab][] = [
    ["Active orders", String(active.length), "Orders"],
    ["Due this week", "3", "Orders"],
    ["Revenue received", money(received), "Payments"],
    ["Outstanding", money(outstanding), "Payments"],
  ];
  return (
    <div className="grid gap-5">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border lg:grid-cols-4">
        {metrics.map(([k, v, t]) => (
          <button
            key={k}
            onClick={() => go(t)}
            className="group bg-card p-4 text-left transition-colors hover:bg-secondary/50"
          >
            <p className="text-xs text-muted-foreground">{k}</p>
            <p className="tabular mt-1.5 text-lg font-semibold sm:text-xl">{v}</p>
            <p className="mt-1 text-[11px] text-primary opacity-0 transition-opacity group-hover:opacity-100">
              Open {t} →
            </p>
          </button>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="surface">
          <p className="border-b border-border px-4 py-3 text-sm font-medium">
            Orders requiring attention
          </p>
          <div className="divide-y divide-border">
            {active.slice(0, 4).map((o) => (
              <div
                key={o.id}
                className="grid grid-cols-[1fr_auto] items-center gap-3 px-4 py-3 text-sm sm:grid-cols-[1fr_auto_auto]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{o.outfit}</p>
                  <p className="truncate text-xs text-muted-foreground">{o.customer}</p>
                </div>
                <span className="hidden text-xs text-muted-foreground sm:block">Due {o.due}</span>
                <StatusPill status={o.status} />
              </div>
            ))}
          </div>
        </div>
        <div className="surface p-4">
          <p className="text-sm font-medium">Production overview</p>
          <div className="mt-4 space-y-3">
            {(["cutting", "sewing", "fitting", "finishing", "ready"] as OrderStatus[]).map((s) => {
              const n = orders.filter((o) => o.status === s).length;
              return (
                <div key={s}>
                  <div className="flex justify-between text-xs">
                    <span>{STATUS_LABEL[s]}</span>
                    <span className="tabular text-muted-foreground">{n}</span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-secondary">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${(n / orders.length) * 100}%` }}
                      transition={{ duration: 0.8 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function DemoCustomers() {
  const [openId, setOpenId] = useState<string | null>(null);
  const [view, setView] = useState<"measurements" | "orders">("measurements");
  const c = demoCustomers.find((x) => x.id === openId);
  if (c) {
    const custOrders = demoOrders.filter((o) => o.customer === c.name);
    return (
      <div>
        <button
          onClick={() => setOpenId(null)}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" /> All customers
        </button>
        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display text-3xl">{c.name}</h3>
            <p className="text-sm text-muted-foreground">
              {c.phone} · Customer since {c.since}
            </p>
          </div>
          <div className="flex rounded-md border border-border bg-card p-0.5 text-sm">
            {(["measurements", "orders"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={cn(
                  "rounded px-3 py-1.5 capitalize",
                  view === v ? "bg-secondary font-medium" : "text-muted-foreground",
                )}
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {view === "measurements"
            ? c.measurements.map((m, i) => (
                <div key={i} className="surface p-4">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{m.garment}</span>
                    <span className="text-muted-foreground">
                      {m.date}
                      {i === 0 && " · latest"}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {m.values.map(([k, v]) => (
                      <div
                        key={k}
                        className="flex justify-between border-b border-dashed border-border pb-1"
                      >
                        <dt className="text-muted-foreground">{k}</dt>
                        <dd className="tabular font-medium">{v} cm</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))
            : custOrders.map((o) => (
                <div key={o.id} className="surface flex items-center justify-between p-4 text-sm">
                  <div>
                    <p className="font-medium">{o.outfit}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {o.due} · {money(o.price)}
                    </p>
                  </div>
                  <StatusPill status={o.status} />
                </div>
              ))}
        </div>
      </div>
    );
  }
  return (
    <div className="surface overflow-hidden">
      <div className="grid grid-cols-[1fr_auto] border-b border-border px-4 py-2.5 text-xs text-muted-foreground sm:grid-cols-[1fr_1fr_auto]">
        <span>Name</span>
        <span className="hidden sm:block">Phone</span>
        <span>Orders</span>
      </div>
      {demoCustomers.map((c) => (
        <button
          key={c.id}
          onClick={() => setOpenId(c.id)}
          className="grid w-full grid-cols-[1fr_auto] items-center border-b border-border px-4 py-3.5 text-left text-sm transition-colors last:border-0 hover:bg-secondary/40 sm:grid-cols-[1fr_1fr_auto]"
        >
          <span className="flex items-center gap-3 font-medium">
            <span className="grid size-8 place-items-center rounded-full bg-wine-soft text-xs text-primary">
              {c.name
                .split(" ")
                .map((p) => p[0])
                .join("")}
            </span>
            {c.name}
          </span>
          <span className="hidden text-muted-foreground sm:block">{c.phone}</span>
          <span className="tabular text-muted-foreground">{c.orders}</span>
        </button>
      ))}
    </div>
  );
}

function DemoStyles() {
  const [col, setCol] = useState("all");
  const [preview, setPreview] = useState<string | null>(null);
  const items = demoStyles.filter((s) => col === "all" || s.collection === col);
  const p = demoStyles.find((s) => s.id === preview);
  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2">
        {demoCollections.map((c) => (
          <button
            key={c.id}
            onClick={() => setCol(c.id)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors",
              col === c.id
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>
      <motion.div layout className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
        <AnimatePresence>
          {items.map((s) => (
            <motion.button
              layout
              key={s.id}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              onClick={() => setPreview(s.id)}
              className="group text-left"
            >
              <div className="overflow-hidden rounded-sm">
                <img
                  src={s.src}
                  alt={s.title}
                  loading="lazy"
                  width={768}
                  height={1024}
                  className="aspect-[3/4] w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                />
              </div>
              <p className="mt-2 text-sm font-medium">{s.title}</p>
              <p className="text-xs text-muted-foreground">{s.tag}</p>
            </motion.button>
          ))}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {p && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-10 grid place-items-center bg-background/90 backdrop-blur-sm"
            onClick={() => setPreview(null)}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 10, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="surface grid max-h-full w-full max-w-2xl grid-cols-[auto_1fr] gap-5 overflow-hidden p-3 shadow-[var(--shadow-float)]"
            >
              <img
                src={p.src}
                alt={p.title}
                className="h-72 w-auto rounded-sm object-cover sm:h-96"
              />
              <div className="py-2 pr-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-display text-2xl">{p.title}</h4>
                  <button aria-label="Close preview" onClick={() => setPreview(null)}>
                    <X className="size-4" />
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{p.tag}</p>
                <p className="mt-6 text-xs font-medium">Linked to</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Adaeze Okafor · Wine wrap blazer dress
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function DemoOrders({
  orders,
  setOrders,
}: {
  orders: DemoOrder[];
  setOrders: (o: DemoOrder[]) => void;
}) {
  return (
    <div className="surface overflow-hidden">
      {orders.map((o) => (
        <div
          key={o.id}
          className="grid gap-3 border-b border-border px-4 py-4 last:border-0 sm:grid-cols-[1fr_200px] sm:items-center"
        >
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-3">
              <p className="truncate font-medium">{o.outfit}</p>
              <span className="text-xs text-muted-foreground sm:hidden">Due {o.due}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {o.customer} <span className="hidden sm:inline">· Due {o.due}</span>
            </p>
            <div className="mt-2.5 h-1 rounded-full bg-secondary">
              <motion.div
                className="h-full rounded-full bg-primary"
                animate={{ width: `${stageProgress(o.status) * 100}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
          </div>
          <select
            aria-label={`Status for ${o.outfit}`}
            value={o.status}
            onChange={(e) =>
              setOrders(
                orders.map((x) =>
                  x.id === o.id ? { ...x, status: e.target.value as OrderStatus } : x,
                ),
              )
            }
            className="h-9 rounded-md border border-border bg-card px-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

function DemoPayments({ orders }: { orders: DemoOrder[] }) {
  const [sel, setSel] = useState(orders[0].id);
  const o = orders.find((x) => x.id === sel)!;
  const s = paymentSummary(o.price, o.paid ? [{ amount: o.paid }] : []);
  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_1.1fr]">
      <div className="surface divide-y divide-border">
        {orders.map((x) => {
          const xs = paymentSummary(x.price, x.paid ? [{ amount: x.paid }] : []);
          return (
            <button
              key={x.id}
              onClick={() => setSel(x.id)}
              className={cn(
                "flex w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm transition-colors",
                sel === x.id ? "bg-secondary/60" : "hover:bg-secondary/30",
              )}
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{x.outfit}</p>
                <p className="text-xs text-muted-foreground">{x.customer}</p>
              </div>
              <span
                className={cn(
                  "shrink-0 text-xs font-medium",
                  xs.status === "paid"
                    ? "text-success"
                    : xs.status === "unpaid"
                      ? "text-destructive"
                      : "text-warning",
                )}
              >
                {PAYMENT_LABEL[xs.status]}
              </span>
            </button>
          );
        })}
      </div>
      <div className="surface p-5">
        <p className="eyebrow">Payment summary</p>
        <h4 className="font-display mt-2 text-2xl">{o.outfit}</h4>
        <div className="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Order total</p>
            <p className="tabular mt-1 font-semibold">{money(o.price)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Received</p>
            <p className="tabular mt-1 font-semibold text-success">{money(s.paid)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className="tabular mt-1 font-semibold">{money(Math.max(s.balance, 0))}</p>
          </div>
        </div>
        <div className="mt-5 h-2 overflow-hidden rounded-full bg-secondary">
          <motion.div
            key={o.id}
            className="h-full bg-success"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(s.paid / o.price, 1) * 100}%` }}
            transition={{ duration: 0.8 }}
          />
        </div>
        <p className="mt-6 text-xs font-medium">Transactions</p>
        {o.paid ? (
          <div className="mt-2 flex justify-between border-t border-border pt-2 text-sm">
            <span className="text-muted-foreground">Bank transfer · 28 Oct</span>
            <span className="tabular">{money(o.paid)}</span>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">No payments recorded yet.</p>
        )}
      </div>
    </div>
  );
}
