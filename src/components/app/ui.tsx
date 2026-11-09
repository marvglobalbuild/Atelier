import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { STATUS_LABEL, PAYMENT_LABEL, type OrderStatus, type PaymentStatus } from "@/lib/domain";

export function PageHeader({
  title,
  sub,
  action,
}: {
  title: string;
  sub?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl sm:text-4xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted-foreground">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
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

export function PayBadge({ status }: { status: PaymentStatus }) {
  const tone =
    status === "paid"
      ? "text-success"
      : status === "unpaid"
        ? "text-destructive"
        : status === "overpaid"
          ? "text-primary"
          : "text-warning";
  return (
    <span className={cn("whitespace-nowrap text-xs font-medium", tone)}>
      {PAYMENT_LABEL[status]}
    </span>
  );
}

export function Empty({
  title,
  body,
  action,
}: {
  title: string;
  body: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border px-6 py-14 text-center">
      <p className="font-display text-2xl">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{body}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("surface", className)}>
      {title && (
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="text-sm font-medium">{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export const selectCls =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring";
