// Pure business rules shared by the demo and the real app.

export const ORDER_STATUSES = [
  "pending",
  "cutting",
  "sewing",
  "fitting",
  "finishing",
  "ready",
  "delivered",
  "cancelled",
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending",
  cutting: "Cutting",
  sewing: "Sewing",
  fitting: "Fitting",
  finishing: "Finishing",
  ready: "Ready for Collection",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Production stages shown on progress bars (excludes terminal/cancelled). */
export const PRODUCTION_STAGES: OrderStatus[] = [
  "pending",
  "cutting",
  "sewing",
  "fitting",
  "finishing",
  "ready",
];
export const ACTIVE_STATUSES: OrderStatus[] = PRODUCTION_STAGES;

export function stageProgress(status: OrderStatus): number {
  if (status === "delivered") return 1;
  if (status === "cancelled") return 0;
  const i = PRODUCTION_STAGES.indexOf(status);
  return (i + 1) / (PRODUCTION_STAGES.length + 1);
}

export type PaymentStatus = "unpaid" | "partial" | "paid" | "overpaid";

/** Paid totals always come from individual transactions. */
export function paymentSummary(price: number, payments: { amount: number }[]) {
  const paid = round2(payments.reduce((s, p) => s + Number(p.amount), 0));
  const balance = round2(price - paid);
  let status: PaymentStatus;
  if (paid === 0 && price > 0) status = "unpaid";
  else if (paid < price) status = "partial";
  else if (paid === price) status = "paid";
  else status = "overpaid";
  return { paid, balance, status };
}

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Part paid",
  paid: "Paid",
  overpaid: "Overpaid",
};

export function isOverdue(
  dueDate: string | null,
  status: OrderStatus,
  today = new Date(),
): boolean {
  if (!dueDate || status === "delivered" || status === "cancelled") return false;
  const t = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return new Date(dueDate + "T00:00:00").getTime() < t;
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export const GARMENT_TEMPLATES: Record<string, string[]> = {
  Gown: [
    "Bust",
    "Under bust",
    "Waist",
    "Hip",
    "Shoulder",
    "Sleeve length",
    "Round arm",
    "Full length",
  ],
  "Blouse / Top": ["Bust", "Waist", "Shoulder", "Sleeve length", "Round arm", "Top length"],
  Trousers: ["Waist", "Hip", "Thigh", "Knee", "Ankle", "Inseam", "Trouser length"],
  "Senator / Kaftan": [
    "Chest",
    "Shoulder",
    "Sleeve length",
    "Neck",
    "Top length",
    "Waist",
    "Trouser length",
  ],
  Skirt: ["Waist", "Hip", "Skirt length"],
  Custom: [],
};
