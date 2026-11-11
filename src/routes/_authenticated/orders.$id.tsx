import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, MessageSquare, Printer, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  check,
  orderQuery,
  stylesQuery,
  useBusiness,
  useInvalidate,
  useUpdateOrderStatus,
} from "@/lib/api";
import {
  PRODUCTION_STAGES,
  STATUS_LABEL,
  isOverdue,
  paymentSummary,
  type OrderStatus,
} from "@/lib/domain";
import { longDate, money } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PaymentDialog } from "@/components/app/dialogs";
import { WhatsAppDialog } from "@/components/app/WhatsAppDialog";
import { CuttingTicketModal } from "@/components/app/CuttingTicketModal";
import { GarmentHangtagModal } from "@/components/app/GarmentHangtagModal";
import { Panel, PayBadge, StatusBadge } from "@/components/app/ui";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/orders/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(orderQuery(params.id)),
  head: () => ({ meta: [{ title: "Order — Atelier" }] }),
  component: OrderPage,
});

function OrderPage() {
  const { id } = Route.useParams();
  const b = useBusiness();
  const inv = useInvalidate();
  const { data } = useSuspenseQuery(orderQuery(id));
  const { data: lib } = useQuery(stylesQuery);
  const { order: o, payments, snapshots, styles, fallbackMeasurements } = data;
  const update = useUpdateOrderStatus();
  const [pay, setPay] = useState(false);
  const [editing, setEditing] = useState(false);
  const [ticketOpen, setTicketOpen] = useState(false);
  const [hangtagOpen, setHangtagOpen] = useState(false);
  const [whatsAppOpen, setWhatsAppOpen] = useState(false);
  const [whatsAppMode, setWhatsAppMode] = useState<"stage" | "fitting" | "receipt" | "custom">(
    "stage",
  );

  const activeMeasurements =
    snapshots.length > 0
      ? (snapshots[0].values as { label: string; value: number }[])
      : (fallbackMeasurements?.values ?? []);
  const activeGarment =
    snapshots.length > 0 ? snapshots[0].garment : (fallbackMeasurements?.garment ?? o.outfit_name);
  const activeUnit =
    snapshots.length > 0 ? snapshots[0].unit : (fallbackMeasurements?.unit ?? "inches");
  const [f, setF] = useState({
    outfit_name: o.outfit_name,
    description: o.description ?? "",
    quantity: String(o.quantity),
    price: String(o.price),
    due_date: o.due_date ?? "",
    production_notes: o.production_notes ?? "",
  });
  const ps = paymentSummary(Number(o.price), payments);
  const stages: OrderStatus[] = [...PRODUCTION_STAGES, "delivered"];
  const idx = stages.indexOf(o.status);

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    try {
      check(
        await supabase
          .from("orders")
          .update({
            outfit_name: f.outfit_name,
            description: f.description || null,
            quantity: Number(f.quantity) || 1,
            price: Number(f.price) || 0,
            due_date: f.due_date || null,
            production_notes: f.production_notes || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", o.id)
          .select(),
      );
      await inv("order", "orders");
      setEditing(false);
      toast.success("Order updated");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });

  return (
    <div>
      <Link
        to="/orders"
        search={{ filter: undefined }}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Orders
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">{o.outfit_name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            <Link
              to="/customers/$id"
              params={{ id: o.customer_id }}
              className="text-foreground hover:text-primary"
            >
              {o.customers?.full_name}
            </Link>
            {" · "}Qty {o.quantity}
            {" · "}
            <Link
              to="/calendar"
              className={cn(
                "hover:text-primary",
                isOverdue(o.due_date, o.status) && "font-medium text-destructive",
              )}
            >
              Due {longDate(o.due_date)}
            </Link>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setWhatsAppMode("stage");
              setWhatsAppOpen(true);
            }}
            className="h-8 gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 shadow-sm"
          >
            <MessageSquare className="size-3.5 text-emerald-600" />
            <span>WhatsApp Client</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setTicketOpen(true)}
            className="h-8 gap-1.5 shadow-sm"
          >
            <Printer className="size-3.5" />
            <span>Cutting Ticket</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setHangtagOpen(true)}
            className="h-8 gap-1.5 shadow-sm"
          >
            <Tag className="size-3.5 text-primary" />
            <span>Garment Tag</span>
          </Button>
          <StatusBadge status={o.status} />
          <Button variant="quiet" size="sm" onClick={() => setEditing((x) => !x)}>
            {editing ? "Cancel" : "Edit"}
          </Button>
        </div>
      </div>

      <Panel className="mt-6 p-5">
        <div className="relative">
          <div className="absolute left-0 right-0 top-[7px] h-px bg-border" />
          <div
            className="absolute left-0 top-[7px] h-px bg-primary transition-all"
            style={{ width: `${(Math.max(idx, 0) / (stages.length - 1)) * 100}%` }}
          />
          <ol className="relative grid grid-cols-7">
            {stages.map((s, i) => (
              <li key={s}>
                <button
                  disabled={update.isPending || o.status === "cancelled"}
                  onClick={() => update.mutate({ order: o, status: s })}
                  className="group flex w-full flex-col items-center gap-2 text-center disabled:cursor-default"
                >
                  <span
                    className={cn(
                      "size-[15px] rounded-full border-2 transition-all",
                      idx >= 0 && i <= idx
                        ? "border-primary bg-primary"
                        : "border-border bg-card group-hover:border-foreground/40",
                    )}
                  />
                  <span
                    className={cn(
                      "text-[10px] leading-tight sm:text-xs",
                      i === idx ? "font-medium" : "text-muted-foreground",
                    )}
                  >
                    {STATUS_LABEL[s]}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="mt-5 flex justify-end">
          <button
            className="text-xs text-muted-foreground hover:text-destructive"
            onClick={() =>
              update.mutate({
                order: o,
                status: o.status === "cancelled" ? "pending" : "cancelled",
              })
            }
          >
            {o.status === "cancelled" ? "Reopen order" : "Cancel order"}
          </button>
        </div>
      </Panel>

      {editing && (
        <form onSubmit={saveEdit} className="surface mt-6 grid gap-4 p-5 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="e1">Outfit name</Label>
            <Input id="e1" required value={f.outfit_name} onChange={set("outfit_name")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e2">Quantity</Label>
            <Input id="e2" type="number" min={1} value={f.quantity} onChange={set("quantity")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e3">Price ({b.currency})</Label>
            <Input
              id="e3"
              type="number"
              min={0}
              step="0.01"
              value={f.price}
              onChange={set("price")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="e4">Delivery date</Label>
            <Input id="e4" type="date" value={f.due_date} onChange={set("due_date")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="e5">Description</Label>
            <Textarea id="e5" value={f.description} onChange={set("description")} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="e6">Production notes</Label>
            <Textarea id="e6" value={f.production_notes} onChange={set("production_notes")} />
          </div>
          <Button variant="ink" className="sm:col-span-2">
            Save changes
          </Button>
        </form>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="space-y-6">
          <Panel title="Details">
            <dl className="grid gap-4 p-4 text-sm sm:grid-cols-2">
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Description</dt>
                <dd className="mt-1 whitespace-pre-wrap">{o.description || "—"}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground">Production notes</dt>
                <dd className="mt-1 whitespace-pre-wrap">{o.production_notes || "—"}</dd>
              </div>
            </dl>
          </Panel>
          <Panel
            title="Measurement snapshot"
            action={
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setTicketOpen(true)}
                className="h-7 text-xs gap-1.5 text-primary hover:text-primary"
              >
                <Printer className="size-3" />
                Workshop Ticket
              </Button>
            }
          >
            {snapshots.length === 0 ? (
              fallbackMeasurements && fallbackMeasurements.values.length > 0 ? (
                <div className="p-4">
                  <div className="flex items-center justify-between pb-1">
                    <p className="text-xs text-muted-foreground">
                      {fallbackMeasurements.garment} · from Customer Master File ·{" "}
                      {fallbackMeasurements.unit}
                    </p>
                    <span className="text-[10px] font-mono uppercase bg-secondary px-2 py-0.5 rounded text-muted-foreground">
                      Profile Default
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    {fallbackMeasurements.values.map((v) => (
                      <div
                        key={v.label}
                        className="flex justify-between border-b border-dashed border-border pb-1"
                      >
                        <dt className="text-muted-foreground">{v.label}</dt>
                        <dd className="tabular">{v.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ) : (
                <p className="p-4 text-sm text-muted-foreground">
                  No measurements were attached when this order was created.
                </p>
              )
            ) : (
              snapshots.map((s) => (
                <div key={s.id} className="p-4">
                  <p className="text-xs text-muted-foreground">
                    {s.garment} · saved {longDate(s.created_at)} · {s.unit}
                  </p>
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                    {(s.values as { label: string; value: number }[]).map((v) => (
                      <div
                        key={v.label}
                        className="flex justify-between border-b border-dashed border-border pb-1"
                      >
                        <dt className="text-muted-foreground">{v.label}</dt>
                        <dd className="tabular">{v.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              ))
            )}
          </Panel>
          <Panel title="Inspiration">
            {styles.length === 0 ? (
              <p className="p-4 text-sm text-muted-foreground">
                Attach images from the{" "}
                <Link to="/style-library" className="text-primary">
                  Style Library
                </Link>
                .
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2 p-3">
                {styles.map((s) =>
                  lib?.urls[s.storage_path] ? (
                    <img
                      key={s.id}
                      src={lib.urls[s.storage_path]}
                      alt={s.title}
                      className="aspect-[3/4] w-full rounded-sm object-cover"
                    />
                  ) : (
                    <div key={s.id} className="aspect-[3/4] rounded-sm bg-secondary" />
                  ),
                )}
              </div>
            )}
          </Panel>
        </div>
        <Panel
          title="Payments"
          action={
            <div className="flex items-center gap-2">
              {payments.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setWhatsAppMode("receipt");
                    setWhatsAppOpen(true);
                  }}
                  className="h-8 gap-1.5 text-xs border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                >
                  <MessageSquare className="size-3 text-emerald-600" />
                  <span>Send Receipt</span>
                </Button>
              )}
              <Button variant="ink" size="sm" onClick={() => setPay(true)}>
                Record payment
              </Button>
            </div>
          }
        >
          <div className="p-4">
            <div className="grid grid-cols-3 gap-2 sm:gap-3 text-sm">
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Total</p>
                <p
                  className="tabular mt-1 font-semibold truncate"
                  title={money(Number(o.price), b.currency)}
                >
                  {money(Number(o.price), b.currency)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">Received</p>
                <p
                  className="tabular mt-1 font-semibold text-success truncate"
                  title={money(ps.paid, b.currency)}
                >
                  {money(ps.paid, b.currency)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">
                  {ps.balance < 0 ? "Overpaid" : "Balance"}
                </p>
                <p
                  className="tabular mt-1 font-semibold truncate"
                  title={money(Math.abs(ps.balance), b.currency)}
                >
                  {money(Math.abs(ps.balance), b.currency)}
                </p>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-success transition-all"
                style={{
                  width: `${Number(o.price) ? Math.min(ps.paid / Number(o.price), 1) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="mt-2">
              <PayBadge status={ps.status} />
            </div>
            <div className="mt-5 divide-y divide-border border-t border-border">
              {payments.length === 0 && (
                <p className="py-3 text-sm text-muted-foreground">No payments recorded.</p>
              )}
              {payments.map((p) => (
                <div key={p.id} className="flex justify-between gap-3 py-2.5 text-sm">
                  <span className="text-muted-foreground">
                    {longDate(p.paid_on)} · <span className="capitalize">{p.method}</span>
                    {p.note && ` · ${p.note}`}
                  </span>
                  <span className="tabular shrink-0">{money(Number(p.amount), b.currency)}</span>
                </div>
              ))}
            </div>
          </div>
        </Panel>
      </div>
      <PaymentDialog open={pay} onOpenChange={setPay} orderId={o.id} />
      <WhatsAppDialog
        open={whatsAppOpen}
        onOpenChange={setWhatsAppOpen}
        clientName={o.customers?.full_name || "Valued Client"}
        clientPhone={o.customers?.phone}
        orderTitle={o.outfit_name}
        currentStage={o.status}
        dueDate={o.due_date ? longDate(o.due_date) : null}
        balanceDue={ps.balance > 0 ? ps.balance : 0}
        totalOrderPrice={Number(o.price)}
        paymentAmount={payments[0]?.amount ? Number(payments[0].amount) : undefined}
        defaultMode={whatsAppMode}
      />
      <CuttingTicketModal
        open={ticketOpen}
        onOpenChange={setTicketOpen}
        order={o}
        businessName={b.name}
        currency={b.currency}
        measurements={activeMeasurements}
        measurementGarment={activeGarment}
        measurementUnit={activeUnit}
      />
      <GarmentHangtagModal
        open={hangtagOpen}
        onOpenChange={setHangtagOpen}
        order={o}
        businessName={b.name}
        currency={b.currency}
      />
    </div>
  );
}
