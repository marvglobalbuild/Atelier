import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Receipt,
  CreditCard,
  ArrowDownRight,
  Clock,
  CheckCircle2,
  Printer,
  MessageSquare,
} from "lucide-react";
import { paymentsQuery, ordersQuery, useBusiness } from "@/lib/api";
import { money, shortDate, longDate, isoDay } from "@/lib/format";
import { paymentSummary } from "@/lib/domain";
import { PageHeader, Empty, Panel } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PaymentDialog } from "@/components/app/dialogs";
import { WhatsAppDialog } from "@/components/app/WhatsAppDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/payments")({
  validateSearch: (s: Record<string, unknown>): { status?: string; from?: string } => ({
    ...(typeof s.status === "string" ? { status: s.status } : {}),
    ...(typeof s.from === "string" ? { from: s.from } : {}),
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(paymentsQuery),
      context.queryClient.ensureQueryData(ordersQuery),
    ]),
  head: () => ({ meta: [{ title: "Payments & Revenue — Atelier" }] }),
  component: PaymentsPage,
});

export function PaymentsPage() {
  const b = useBusiness();
  const { data: payments = [] } = useQuery(paymentsQuery);
  const { data: orders = [] } = useQuery(ordersQuery);

  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [isRecordOpen, setIsRecordOpen] = useState(false);
  const [receiptPayment, setReceiptPayment] = useState<(typeof payments)[number] | null>(null);
  const [whatsAppModal, setWhatsAppModal] = useState<{
    open: boolean;
    customerName?: string;
    customerPhone?: string;
    orderTitle?: string;
    paymentAmount?: number;
    orderTotal?: number;
    orderBalance?: number;
  }>({ open: false });

  // Calculate high-level financial metrics
  const stats = useMemo(() => {
    const totalCollected = payments.reduce((sum, p) => sum + Number(p.amount), 0);

    // Calculate outstanding balances on active orders
    const outstandingBalances = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => {
        const ps = paymentSummary(Number(o.price), o.payments);
        return sum + Math.max(0, ps.balance);
      }, 0);

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const thisMonthCollected = payments
      .filter((p) => p.paid_on >= firstOfMonth)
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalCollected,
      outstandingBalances,
      thisMonthCollected,
      totalCount: payments.length,
    };
  }, [payments, orders]);

  // Filtered payments
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      // Method filter
      if (methodFilter !== "all" && p.method !== methodFilter) return false;

      // Period filter
      if (periodFilter !== "all") {
        const date = new Date();
        if (periodFilter === "month") {
          date.setDate(1);
        } else if (periodFilter === "7d") {
          date.setDate(date.getDate() - 7);
        } else if (periodFilter === "30d") {
          date.setDate(date.getDate() - 30);
        }
        const threshold = isoDay(date);
        if (p.paid_on < threshold) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const customerName = p.orders?.customers?.full_name?.toLowerCase() ?? "";
        const outfitName = p.orders?.outfit_name?.toLowerCase() ?? "";
        const ref = (p.reference ?? "").toLowerCase();
        const note = (p.notes ?? "").toLowerCase();
        if (
          !customerName.includes(q) &&
          !outfitName.includes(q) &&
          !ref.includes(q) &&
          !note.includes(q)
        ) {
          return false;
        }
      }

      return true;
    });
  }, [payments, methodFilter, periodFilter, searchQuery]);

  const methodLabel: Record<string, string> = {
    bank_transfer: "Bank Transfer",
    transfer: "Bank Transfer",
    card: "POS / Card",
    cash: "Cash",
    mobile_money: "Mobile Money",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Revenue"
        sub="Track client deposits, balance settlements, and atelier cash flow."
        action={
          <Button variant="hero" onClick={() => setIsRecordOpen(true)}>
            <Plus className="size-4 mr-2" />
            Record Payment
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Panel className="p-4">
          <p className="eyebrow">Total Revenue Collected</p>
          <p className="font-display text-3xl mt-2 text-foreground">
            {money(stats.totalCollected, b.currency)}
          </p>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <CheckCircle2 className="size-3.5 text-success mr-1" />
            Across {stats.totalCount} completed payments
          </div>
        </Panel>

        <Panel className="p-4">
          <p className="eyebrow">Outstanding In Production</p>
          <p className="font-display text-3xl mt-2 text-foreground">
            {money(stats.outstandingBalances, b.currency)}
          </p>
          <div className="mt-2 flex items-center text-xs text-warning">
            <Clock className="size-3.5 mr-1" /> Pending final delivery settlements
          </div>
        </Panel>

        <Panel className="p-4">
          <p className="eyebrow">This Month's Inflow</p>
          <p className="font-display text-3xl mt-2 text-foreground">
            {money(stats.thisMonthCollected, b.currency)}
          </p>
          <div className="mt-2 flex items-center text-xs text-muted-foreground">
            <ArrowDownRight className="size-3.5 text-primary mr-1" /> Fresh client receipts
          </div>
        </Panel>

        <Panel className="p-4">
          <p className="eyebrow">Active Payment Methods</p>
          <p className="font-display text-3xl mt-2 text-foreground">4 Types</p>
          <p className="mt-2 text-xs text-muted-foreground">Bank Transfer, Card, Cash & Mobile</p>
        </Panel>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by customer, outfit or reference…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 bg-card"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Payment Methods</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="card">Card / POS</option>
            <option value="cash">Cash</option>
            <option value="mobile_money">Mobile Money</option>
          </select>

          <select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            className="h-10 rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="all">All Dates</option>
            <option value="month">This Month</option>
            <option value="30d">Last 30 Days</option>
            <option value="7d">Last 7 Days</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      {filteredPayments.length === 0 ? (
        <Empty
          title="No payment records found"
          body={
            searchQuery || methodFilter !== "all" || periodFilter !== "all"
              ? "No transactions match your current search and filter criteria."
              : "Record your first customer deposit or balance payment."
          }
          action={
            <Button variant="outline" onClick={() => setIsRecordOpen(true)}>
              <Plus className="size-4 mr-2" /> Record First Payment
            </Button>
          }
        />
      ) : (
        <div className="surface overflow-hidden rounded-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-secondary/50 text-xs uppercase tracking-wider text-muted-foreground border-b border-border">
                <tr>
                  <th className="py-3 px-4 font-medium">Date</th>
                  <th className="py-3 px-4 font-medium">Client</th>
                  <th className="py-3 px-4 font-medium">Order / Outfit</th>
                  <th className="py-3 px-4 font-medium">Method</th>
                  <th className="py-3 px-4 font-medium">Reference & Notes</th>
                  <th className="py-3 px-4 font-medium text-right">Amount</th>
                  <th className="py-3 px-4 font-medium text-center">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPayments.map((p) => {
                  const customerName = p.orders?.customers?.full_name ?? "Direct Client";
                  const outfitName = p.orders?.outfit_name ?? "Bespoke Order";
                  const methodStr = methodLabel[p.method] ?? p.method;
                  const notes = p.notes ?? "";

                  return (
                    <tr key={p.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap text-muted-foreground font-mono text-xs">
                        {shortDate(p.paid_on)}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-foreground">
                        {p.orders?.customers ? (
                          <Link
                            to="/customers/$id"
                            params={{ id: p.orders.customers.id ?? "c1" }}
                            className="hover:underline hover:text-primary"
                          >
                            {customerName}
                          </Link>
                        ) : (
                          customerName
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-foreground/90">
                        {p.order_id ? (
                          <Link
                            to="/orders/$id"
                            params={{ id: p.order_id }}
                            className="hover:underline hover:text-primary font-medium"
                          >
                            {outfitName}
                          </Link>
                        ) : (
                          outfitName
                        )}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-secondary text-foreground font-medium">
                          <CreditCard className="size-3 text-muted-foreground" />
                          {methodStr}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground max-w-xs truncate">
                        {p.reference && (
                          <span className="font-mono text-foreground/80 mr-1.5">
                            [{p.reference}]
                          </span>
                        )}
                        {notes || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-medium text-foreground whitespace-nowrap">
                        <span className="font-display text-base text-success">
                          +{money(Number(p.amount), b.currency)}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                            title="Generate payment voucher / receipt"
                            onClick={() => setReceiptPayment(p)}
                          >
                            <Receipt className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600"
                            title="Send receipt to client via WhatsApp"
                            onClick={() => {
                              const order = p.orders;
                              const customer = order?.customers;
                              setWhatsAppModal({
                                open: true,
                                customerName: customer?.full_name || "",
                                customerPhone: customer?.phone || "",
                                orderTitle: order?.outfit_name || "Bespoke Garment",
                                paymentAmount: Number(p.amount),
                                orderTotal: order?.price ? Number(order.price) : Number(p.amount),
                                orderBalance: order?.price
                                  ? Math.max(0, Number(order.price) - Number(p.amount))
                                  : 0,
                              });
                            }}
                          >
                            <MessageSquare className="size-4 text-emerald-600" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Official Receipt Voucher Modal */}
      <Dialog open={!!receiptPayment} onOpenChange={(o) => !o && setReceiptPayment(null)}>
        <DialogContent className="max-w-md p-6">
          {receiptPayment && (
            <div>
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div>
                  <h3 className="font-display text-2xl tracking-tight text-foreground">{b.name}</h3>
                  <p className="text-xs text-muted-foreground">Official Payment Voucher</p>
                </div>
                <div className="text-right">
                  <p className="font-mono text-xs text-muted-foreground">
                    #{receiptPayment.reference || receiptPayment.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {shortDate(receiptPayment.paid_on)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 py-6 text-sm">
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Received From:</span>
                  <span className="font-medium">
                    {receiptPayment.orders?.customers?.full_name ?? "Valued Client"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Outfit / Project:</span>
                  <span className="font-medium">
                    {receiptPayment.orders?.outfit_name ?? "Bespoke Garment"}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/50">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium">
                    {methodLabel[receiptPayment.method] ?? receiptPayment.method}
                  </span>
                </div>
                {receiptPayment.notes && (
                  <div className="flex justify-between py-1 border-b border-border/50">
                    <span className="text-muted-foreground">Notes:</span>
                    <span className="text-right max-w-xs">{receiptPayment.notes}</span>
                  </div>
                )}
                <div className="flex items-baseline justify-between pt-3">
                  <span className="font-medium text-foreground">Amount Paid:</span>
                  <span className="font-display text-2xl text-success">
                    {money(Number(receiptPayment.amount), b.currency)}
                  </span>
                </div>
              </div>

              <div className="rounded-lg bg-secondary/50 p-3 text-center text-xs text-muted-foreground">
                Thank you for your business. Handcrafted with bespoke precision.
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setReceiptPayment(null)}>
                  Close
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                  onClick={() => {
                    const order = receiptPayment.orders;
                    const customer = order?.customers;
                    setWhatsAppModal({
                      open: true,
                      customerName: customer?.full_name || "",
                      customerPhone: customer?.phone || "",
                      orderTitle: order?.outfit_name || "Bespoke Garment",
                      paymentAmount: Number(receiptPayment.amount),
                      orderTotal: order?.price
                        ? Number(order.price)
                        : Number(receiptPayment.amount),
                      orderBalance: order?.price
                        ? Math.max(0, Number(order.price) - Number(receiptPayment.amount))
                        : 0,
                    });
                  }}
                >
                  <MessageSquare className="size-3.5 mr-1.5 text-emerald-600 dark:text-emerald-400" />
                  WhatsApp Receipt
                </Button>
                <Button
                  variant="ink"
                  size="sm"
                  onClick={() => {
                    window.print();
                  }}
                >
                  <Printer className="size-3.5 mr-1.5" /> Print Receipt
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <PaymentDialog open={isRecordOpen} onOpenChange={setIsRecordOpen} />

      {/* WhatsApp Payment Receipt Modal */}
      <WhatsAppDialog
        open={whatsAppModal.open}
        onOpenChange={(open) => setWhatsAppModal((prev) => ({ ...prev, open }))}
        defaultMode="payment"
        customerName={whatsAppModal.customerName}
        customerPhone={whatsAppModal.customerPhone}
        orderTitle={whatsAppModal.orderTitle}
        paymentAmount={whatsAppModal.paymentAmount}
        orderTotal={whatsAppModal.orderTotal}
        orderBalance={whatsAppModal.orderBalance}
      />
    </div>
  );
}
