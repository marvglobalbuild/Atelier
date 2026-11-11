import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search, Printer, Tag } from "lucide-react";
import { ordersQuery, useBusiness, useUpdateOrderStatus } from "@/lib/api";
import {
  ACTIVE_STATUSES,
  ORDER_STATUSES,
  STATUS_LABEL,
  isOverdue,
  paymentSummary,
  stageProgress,
  type OrderStatus,
} from "@/lib/domain";
import { money, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { OrderDialog } from "@/components/app/dialogs";
import { CuttingTicketModal } from "@/components/app/CuttingTicketModal";
import { GarmentHangtagModal } from "@/components/app/GarmentHangtagModal";
import { Empty, PageHeader, PayBadge } from "@/components/app/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/orders/")({
  validateSearch: (s: Record<string, unknown>): { filter?: string } => ({
    filter: typeof s.filter === "string" ? s.filter : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(ordersQuery),
  head: () => ({ meta: [{ title: "Orders — Atelier" }] }),
  component: Orders,
});

const FILTERS: [string, string][] = [
  ["all", "All"],
  ["active", "Active"],
  ["overdue", "Overdue"],
  ...ORDER_STATUSES.map((s) => [s, STATUS_LABEL[s]] as [string, string]),
];

function Orders() {
  const b = useBusiness();
  const { filter = "all" } = Route.useSearch();
  const navigate = useNavigate({ from: "/orders/" });
  const { data } = useSuspenseQuery(ordersQuery);
  const update = useUpdateOrderStatus();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [selectedTicketOrder, setSelectedTicketOrder] = useState<(typeof data)[number] | null>(
    null,
  );
  const [selectedHangtagOrder, setSelectedHangtagOrder] = useState<(typeof data)[number] | null>(
    null,
  );

  const list = data.filter((o) => {
    if (filter === "active" && !ACTIVE_STATUSES.includes(o.status)) return false;
    if (filter === "overdue" && !isOverdue(o.due_date, o.status)) return false;
    if ((ORDER_STATUSES as readonly string[]).includes(filter) && o.status !== filter) return false;
    return (o.outfit_name + " " + (o.customers?.full_name ?? ""))
      .toLowerCase()
      .includes(q.toLowerCase());
  });

  return (
    <div>
      <PageHeader
        title="Orders"
        sub={`${data.filter((o) => ACTIVE_STATUSES.includes(o.status)).length} in production`}
        action={
          <Button variant="hero" onClick={() => setOpen(true)}>
            <Plus />
            New order
          </Button>
        }
      />
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search orders"
          placeholder="Search outfit or customer"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-10 bg-card pl-9"
        />
      </div>
      <div className="-mx-4 mb-4 flex gap-1.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        {FILTERS.map(([k, l]) => (
          <button
            key={k}
            onClick={() => navigate({ search: { filter: k === "all" ? undefined : k } })}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1 text-xs transition-colors",
              filter === k
                ? "border-foreground bg-foreground text-background"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {l}
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <Empty
          title={data.length ? "No orders match" : "No orders yet"}
          body={data.length ? "Try another filter." : "Create an order for one of your customers."}
        />
      ) : (
        <div className="surface overflow-hidden">
          {list.map((o) => {
            const ps = paymentSummary(Number(o.price), o.payments);
            const od = isOverdue(o.due_date, o.status);
            return (
              <div
                key={o.id}
                className="grid gap-3 border-b border-border px-4 py-3.5 last:border-0 sm:grid-cols-[1.6fr_auto_auto_260px] sm:items-center sm:gap-5"
              >
                <Link to="/orders/$id" params={{ id: o.id }} className="group min-w-0">
                  <p className="truncate text-sm font-medium group-hover:text-primary">
                    {o.outfit_name}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {o.customers?.full_name} ·{" "}
                    <span className={od ? "font-medium text-destructive" : ""}>
                      {od ? "Overdue " : "Due "}
                      {shortDate(o.due_date)}
                    </span>
                  </p>
                  <div className="mt-2 h-1 rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${stageProgress(o.status) * 100}%` }}
                    />
                  </div>
                </Link>
                <span className="tabular text-sm">{money(Number(o.price), b.currency)}</span>
                <PayBadge status={ps.status} />
                <div className="flex items-center gap-1.5">
                  <select
                    aria-label={`Status for ${o.outfit_name}`}
                    value={o.status}
                    disabled={update.isPending}
                    onChange={(e) =>
                      update.mutate({ order: o, status: e.target.value as OrderStatus })
                    }
                    className="h-9 flex-1 rounded-md border border-input bg-card px-2.5 text-sm"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground shrink-0"
                    title="Print workshop cutting ticket"
                    onClick={() => setSelectedTicketOrder(o)}
                  >
                    <Printer className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 text-muted-foreground hover:text-primary shrink-0"
                    title="Print garment bag hangtag & claim stub"
                    onClick={() => setSelectedHangtagOrder(o)}
                  >
                    <Tag className="size-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <OrderDialog
        open={open}
        onOpenChange={setOpen}
        onSaved={(id) => navigate({ to: "/orders/$id", params: { id } })}
      />
      <CuttingTicketModal
        open={!!selectedTicketOrder}
        onOpenChange={(isOpen) => !isOpen && setSelectedTicketOrder(null)}
        order={selectedTicketOrder}
        businessName={b.name}
        currency={b.currency}
      />
      <GarmentHangtagModal
        open={!!selectedHangtagOrder}
        onOpenChange={(isOpen) => !isOpen && setSelectedHangtagOrder(null)}
        order={selectedHangtagOrder}
        businessName={b.name}
        currency={b.currency}
      />
    </div>
  );
}
