import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  check,
  customersQuery,
  logActivity,
  useBusiness,
  useInvalidate,
  type Customer,
} from "@/lib/api";
import { isoDay } from "@/lib/format";
import { selectCls } from "./ui";

function Field({
  label,
  id,
  children,
  className,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={"space-y-1.5 " + (className ?? "")}>
      <Label htmlFor={id}>{label}</Label>
      {children}
    </div>
  );
}

/* ---------- Customer ---------- */
export function CustomerDialog({
  open,
  onOpenChange,
  customer,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customer?: Customer;
  onSaved?: (id: string) => void;
}) {
  const b = useBusiness();
  const inv = useInvalidate();
  const [f, setF] = useState({ full_name: "", phone: "", email: "", address: "", notes: "" });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open)
      setF({
        full_name: customer?.full_name ?? "",
        phone: customer?.phone ?? "",
        email: customer?.email ?? "",
        address: customer?.address ?? "",
        notes: customer?.notes ?? "",
      });
  }, [open, customer]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (customer) {
        check(
          await supabase
            .from("customers")
            .update({ ...f, updated_at: new Date().toISOString() })
            .eq("id", customer.id)
            .select(),
        );
        await logActivity(b.id, "customer", "update", `Updated ${f.full_name}`, customer.id);
        onSaved?.(customer.id);
      } else {
        const c = check(
          await supabase
            .from("customers")
            .insert({ ...f, business_id: b.id })
            .select()
            .single(),
        );
        await logActivity(b.id, "customer", "create", `Added customer ${f.full_name}`, c.id);
        onSaved?.(c.id);
      }
      await inv("customers", "customer", "activity");
      toast.success(customer ? "Customer updated" : "Customer added");
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const set =
    (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">
            {customer ? "Edit customer" : "New customer"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" id="cn" className="sm:col-span-2">
            <Input id="cn" required value={f.full_name} onChange={set("full_name")} />
          </Field>
          <Field label="Phone" id="cp">
            <Input id="cp" type="tel" value={f.phone} onChange={set("phone")} />
          </Field>
          <Field label="Email" id="ce">
            <Input id="ce" type="email" value={f.email} onChange={set("email")} />
          </Field>
          <Field label="Address" id="ca" className="sm:col-span-2">
            <Input id="ca" value={f.address} onChange={set("address")} />
          </Field>
          <Field label="Notes & preferences" id="cno" className="sm:col-span-2">
            <Textarea id="cno" value={f.notes} onChange={set("notes")} />
          </Field>
          <Button variant="ink" disabled={busy} className="sm:col-span-2">
            {busy ? "Saving…" : "Save customer"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Measurements ---------- */
export function MeasurementDialog({
  open,
  onOpenChange,
  customerId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customerId?: string;
}) {
  const b = useBusiness();
  const inv = useInvalidate();
  const { data: customers = [] } = useQuery({ ...customersQuery, enabled: open && !customerId });
  const { data: templates = [] } = useQuery({
    queryKey: ["templates"],
    enabled: open,
    queryFn: async () =>
      check(
        await supabase
          .from("measurement_templates")
          .select("*, measurement_fields(*)")
          .order("name"),
      ),
  });
  const [cust, setCust] = useState(customerId ?? "");
  const [tpl, setTpl] = useState("");
  const [garment, setGarment] = useState("");
  const [unit, setUnit] = useState(b.measurement_unit);
  const [date, setDate] = useState(isoDay(new Date()));
  const [rows, setRows] = useState<{ label: string; value: string }[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setCust(customerId ?? "");
      setTpl("");
      setGarment("");
      setRows([{ label: "", value: "" }]);
      setUnit(b.measurement_unit);
      setDate(isoDay(new Date()));
    }
  }, [open, customerId, b.measurement_unit]);

  function pickTemplate(id: string) {
    setTpl(id);
    const t = templates.find((x) => x.id === id);
    if (t) {
      setGarment(t.name);
      setRows(
        [...t.measurement_fields]
          .sort((a, c) => a.position - c.position)
          .map((f) => ({ label: f.label, value: "" })),
      );
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const vals = rows.filter((r) => r.label.trim() && r.value !== "" && !isNaN(Number(r.value)));
    if (!cust) return toast.error("Choose a customer");
    if (!vals.length) return toast.error("Enter at least one measurement");
    setBusy(true);
    try {
      const s = check(
        await supabase
          .from("customer_measurement_sets")
          .insert({
            business_id: b.id,
            customer_id: cust,
            template_id: tpl || null,
            garment: garment || "Custom",
            unit,
            taken_on: date,
          })
          .select()
          .single(),
      );
      check(
        await supabase
          .from("customer_measurement_values")
          .insert(
            vals.map((v, i) => ({
              business_id: b.id,
              set_id: s.id,
              label: v.label.trim(),
              value: Number(v.value),
              position: i,
            })),
          )
          .select(),
      );
      await logActivity(
        b.id,
        "measurement",
        "create",
        `New ${garment || "custom"} measurements recorded`,
        cust,
      );
      await inv("customer", "measurement-sets", "activity");
      toast.success("Measurements saved");
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">
            Record measurements
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="grid gap-4">
          {!customerId && (
            <Field label="Customer" id="mc">
              <select
                id="mc"
                required
                value={cust}
                onChange={(e) => setCust(e.target.value)}
                className={selectCls}
              >
                <option value="">Select customer…</option>
                {customers
                  .filter((c) => !c.archived_at)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.full_name}
                    </option>
                  ))}
              </select>
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Template" id="mt" className="col-span-2">
              <select
                id="mt"
                value={tpl}
                onChange={(e) => pickTemplate(e.target.value)}
                className={selectCls}
              >
                <option value="">Custom fields</option>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Unit" id="mu">
              <select
                id="mu"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className={selectCls}
              >
                <option value="cm">cm</option>
                <option value="in">in</option>
              </select>
            </Field>
            <Field label="Date" id="md">
              <Input id="md" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>
          <Field label="Garment" id="mg">
            <Input
              id="mg"
              placeholder="e.g. Wedding gown"
              value={garment}
              onChange={(e) => setGarment(e.target.value)}
            />
          </Field>
          <div className="space-y-2">
            <Label>Measurements ({unit})</Label>
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[1fr_110px_auto] gap-2">
                <Input
                  aria-label="Measurement name"
                  placeholder="Name"
                  value={r.label}
                  onChange={(e) =>
                    setRows(rows.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))
                  }
                />
                <Input
                  aria-label={`${r.label || "Value"}`}
                  inputMode="decimal"
                  type="number"
                  step="0.1"
                  placeholder="0"
                  value={r.value}
                  onChange={(e) =>
                    setRows(rows.map((x, j) => (j === i ? { ...x, value: e.target.value } : x)))
                  }
                  className="tabular"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="Remove row"
                  onClick={() => setRows(rows.filter((_, j) => j !== i))}
                >
                  ×
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="quiet"
              size="sm"
              onClick={() => setRows([...rows, { label: "", value: "" }])}
            >
              Add field
            </Button>
          </div>
          <Button variant="ink" disabled={busy}>
            {busy ? "Saving…" : "Save measurements"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Order ---------- */
export function OrderDialog({
  open,
  onOpenChange,
  customerId,
  defaultOutfitName,
  defaultDescription,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customerId?: string;
  defaultOutfitName?: string;
  defaultDescription?: string;
  onSaved?: (id: string) => void;
}) {
  const b = useBusiness();
  const inv = useInvalidate();
  const { data: customers = [] } = useQuery({ ...customersQuery, enabled: open });
  const [f, setF] = useState({
    customer_id: customerId ?? "",
    outfit_name: defaultOutfitName ?? "",
    description: defaultDescription ?? "",
    quantity: "1",
    price: "",
    due_date: "",
    production_notes: "",
    set_id: "",
    deposit: "",
  });
  const [busy, setBusy] = useState(false);
  const { data: sets = [] } = useQuery({
    queryKey: ["sets-for", f.customer_id],
    enabled: open && !!f.customer_id,
    queryFn: async () =>
      check(
        await supabase
          .from("customer_measurement_sets")
          .select("*, customer_measurement_values(*)")
          .eq("customer_id", f.customer_id)
          .order("taken_on", { ascending: false }),
      ),
  });
  useEffect(() => {
    if (open)
      setF({
        customer_id: customerId ?? "",
        outfit_name: defaultOutfitName ?? "",
        description: defaultDescription ?? "",
        quantity: "1",
        price: "",
        due_date: "",
        production_notes: "",
        set_id: "",
        deposit: "",
      });
  }, [open, customerId, defaultOutfitName, defaultDescription]);
  useEffect(() => {
    if (sets[0] && !f.set_id) setF((x) => ({ ...x, set_id: sets[0].id }));
  }, [sets]); // eslint-disable-line react-hooks/exhaustive-deps

  const set =
    (k: keyof typeof f) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setF({ ...f, [k]: e.target.value });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.customer_id) return toast.error("An order must belong to a customer");
    setBusy(true);
    try {
      const o = check(
        await supabase
          .from("orders")
          .insert({
            business_id: b.id,
            customer_id: f.customer_id,
            outfit_name: f.outfit_name,
            description: f.description || null,
            quantity: Number(f.quantity) || 1,
            price: Number(f.price) || 0,
            due_date: f.due_date || null,
            production_notes: f.production_notes || null,
          })
          .select()
          .single(),
      );
      const ms = sets.find((s) => s.id === f.set_id);
      if (ms) {
        check(
          await supabase
            .from("order_measurement_snapshots")
            .insert({
              business_id: b.id,
              order_id: o.id,
              source_set_id: ms.id,
              garment: ms.garment,
              unit: ms.unit,
              values: [...ms.customer_measurement_values]
                .sort((a, c) => a.position - c.position)
                .map((v) => ({ label: v.label, value: Number(v.value) })),
            })
            .select(),
        );
      }
      if (Number(f.deposit) > 0) {
        check(
          await supabase
            .from("payments")
            .insert({
              business_id: b.id,
              order_id: o.id,
              amount: Number(f.deposit),
              method: "deposit",
            })
            .select(),
        );
      }
      await logActivity(b.id, "order", "create", `New order: ${f.outfit_name}`, o.id);
      await inv("orders", "customer", "payments", "activity");
      toast.success("Order created");
      onOpenChange(false);
      onSaved?.(o.id);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">New order</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          <Field label="Customer" id="oc" className="sm:col-span-2">
            <select
              id="oc"
              required
              value={f.customer_id}
              onChange={(e) => setF({ ...f, customer_id: e.target.value, set_id: "" })}
              className={selectCls}
              disabled={!!customerId}
            >
              <option value="">Select customer…</option>
              {customers
                .filter((c) => !c.archived_at || c.id === customerId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.full_name}
                  </option>
                ))}
            </select>
          </Field>
          <Field label="Outfit name" id="on" className="sm:col-span-2">
            <Input id="on" required value={f.outfit_name} onChange={set("outfit_name")} />
          </Field>
          <Field label="Description" id="od" className="sm:col-span-2">
            <Textarea id="od" value={f.description} onChange={set("description")} />
          </Field>
          <Field label="Quantity" id="oq">
            <Input id="oq" type="number" min={1} value={f.quantity} onChange={set("quantity")} />
          </Field>
          <Field label={`Price (${b.currency})`} id="op">
            <Input
              id="op"
              type="number"
              min={0}
              step="0.01"
              required
              value={f.price}
              onChange={set("price")}
              className="tabular"
            />
          </Field>
          <Field label="Delivery date" id="odd">
            <Input id="odd" type="date" value={f.due_date} onChange={set("due_date")} />
          </Field>
          <Field label={`Deposit received (${b.currency})`} id="odp">
            <Input
              id="odp"
              type="number"
              min={0}
              step="0.01"
              value={f.deposit}
              onChange={set("deposit")}
              className="tabular"
            />
          </Field>
          {f.customer_id && (
            <Field label="Measurements to use" id="oms" className="sm:col-span-2">
              <select id="oms" value={f.set_id} onChange={set("set_id")} className={selectCls}>
                <option value="">None</option>
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.garment} · {s.taken_on}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                A copy is kept with the order, even if measurements change later.
              </p>
            </Field>
          )}
          <Field label="Production notes" id="opn" className="sm:col-span-2">
            <Textarea id="opn" value={f.production_notes} onChange={set("production_notes")} />
          </Field>
          <Button variant="ink" disabled={busy} className="sm:col-span-2">
            {busy ? "Creating…" : "Create order"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* ---------- Payment ---------- */
export function PaymentDialog({
  open,
  onOpenChange,
  orderId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  orderId?: string;
}) {
  const b = useBusiness();
  const inv = useInvalidate();
  const { data: orders = [] } = useQuery({
    queryKey: ["orders-lite"],
    enabled: open && !orderId,
    queryFn: async () =>
      check(
        await supabase
          .from("orders")
          .select("id, outfit_name, customers(full_name)")
          .neq("status", "cancelled")
          .order("created_at", { ascending: false }),
      ),
  });
  const [f, setF] = useState({
    order_id: orderId ?? "",
    amount: "",
    method: "transfer",
    paid_on: isoDay(new Date()),
    note: "",
  });
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open)
      setF({
        order_id: orderId ?? "",
        amount: "",
        method: "transfer",
        paid_on: isoDay(new Date()),
        note: "",
      });
  }, [open, orderId]);
  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f.order_id) return toast.error("Choose an order");
    if (!(Number(f.amount) > 0)) return toast.error("Enter an amount greater than zero");
    setBusy(true);
    try {
      check(
        await supabase
          .from("payments")
          .insert({
            business_id: b.id,
            order_id: f.order_id,
            amount: Number(f.amount),
            method: f.method,
            paid_on: f.paid_on,
            note: f.note || null,
          })
          .select(),
      );
      await logActivity(
        b.id,
        "payment",
        "create",
        `Payment of ${b.currency} ${Number(f.amount).toLocaleString()} recorded`,
        f.order_id,
      );
      await inv("payments", "orders", "order", "customer", "activity");
      toast.success("Payment recorded");
      onOpenChange(false);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display text-2xl font-normal">Record payment</DialogTitle>
        </DialogHeader>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          {!orderId && (
            <Field label="Order" id="po" className="sm:col-span-2">
              <select
                id="po"
                required
                value={f.order_id}
                onChange={set("order_id")}
                className={selectCls}
              >
                <option value="">Select order…</option>
                {orders.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.outfit_name} — {(o.customers as { full_name: string } | null)?.full_name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label={`Amount (${b.currency})`} id="pa">
            <Input
              id="pa"
              type="number"
              min={0.01}
              step="0.01"
              required
              value={f.amount}
              onChange={set("amount")}
              className="tabular"
              autoFocus
            />
          </Field>
          <Field label="Date" id="pd">
            <Input id="pd" type="date" value={f.paid_on} onChange={set("paid_on")} />
          </Field>
          <Field label="Method" id="pm" className="sm:col-span-2">
            <select id="pm" value={f.method} onChange={set("method")} className={selectCls}>
              <option value="transfer">Bank transfer</option>
              <option value="cash">Cash</option>
              <option value="pos">Card / POS</option>
              <option value="deposit">Deposit</option>
              <option value="other">Other</option>
            </select>
          </Field>
          <Field label="Note" id="pn" className="sm:col-span-2">
            <Input id="pn" value={f.note} onChange={set("note")} />
          </Field>
          <p className="text-xs text-muted-foreground sm:col-span-2">
            Payments are kept as a permanent history and can’t be edited after saving.
          </p>
          <Button variant="ink" disabled={busy} className="sm:col-span-2">
            {busy ? "Saving…" : "Record payment"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
