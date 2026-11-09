import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { customersQuery } from "@/lib/api";
import { initials, longDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CustomerDialog } from "@/components/app/dialogs";
import { Empty, PageHeader } from "@/components/app/ui";

export const Route = createFileRoute("/_authenticated/customers/")({
  loader: ({ context }) => context.queryClient.ensureQueryData(customersQuery),
  head: () => ({ meta: [{ title: "Customers — Atelier" }] }),
  component: Customers,
});

function Customers() {
  const { data } = useSuspenseQuery(customersQuery);
  const [q, setQ] = useState("");
  const [archived, setArchived] = useState(false);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const list = data.filter(
    (c) =>
      (archived ? c.archived_at : !c.archived_at) &&
      (c.full_name + " " + (c.phone ?? "") + " " + (c.email ?? ""))
        .toLowerCase()
        .includes(q.toLowerCase()),
  );

  return (
    <div>
      <PageHeader
        title="Customers"
        sub={`${data.filter((c) => !c.archived_at).length} active`}
        action={
          <Button variant="hero" onClick={() => setOpen(true)}>
            <Plus />
            New customer
          </Button>
        }
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search customers"
            placeholder="Search name, phone or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="h-10 bg-card pl-9"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted-foreground">
          <input
            type="checkbox"
            checked={archived}
            onChange={(e) => setArchived(e.target.checked)}
            className="accent-[var(--color-primary)]"
          />
          Show archived
        </label>
      </div>
      {list.length === 0 ? (
        <Empty
          title={data.length ? "No matches" : "No customers yet"}
          body={
            data.length
              ? "Try a different search."
              : "Add your first customer to start recording measurements and orders."
          }
          action={
            !data.length ? (
              <Button variant="ink" onClick={() => setOpen(true)}>
                Add customer
              </Button>
            ) : undefined
          }
        />
      ) : (
        <div className="surface overflow-hidden">
          <div className="hidden grid-cols-[1.5fr_1fr_1fr_auto] border-b border-border px-4 py-2.5 text-xs text-muted-foreground sm:grid">
            <span>Name</span>
            <span>Phone</span>
            <span>Email</span>
            <span>Added</span>
          </div>
          {list.map((c) => (
            <Link
              key={c.id}
              to="/customers/$id"
              params={{ id: c.id }}
              className="grid grid-cols-[1fr_auto] items-center gap-3 border-b border-border px-4 py-3 text-sm transition-colors last:border-0 hover:bg-secondary/40 sm:grid-cols-[1.5fr_1fr_1fr_auto]"
            >
              <span className="flex min-w-0 items-center gap-3 font-medium">
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-wine-soft text-xs text-primary">
                  {initials(c.full_name)}
                </span>
                <span className="truncate">{c.full_name}</span>
              </span>
              <span className="truncate text-muted-foreground">{c.phone || "—"}</span>
              <span className="hidden truncate text-muted-foreground sm:block">
                {c.email || "—"}
              </span>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {longDate(c.created_at)}
              </span>
            </Link>
          ))}
        </div>
      )}
      <CustomerDialog
        open={open}
        onOpenChange={setOpen}
        onSaved={(id) => navigate({ to: "/customers/$id", params: { id } })}
      />
    </div>
  );
}
