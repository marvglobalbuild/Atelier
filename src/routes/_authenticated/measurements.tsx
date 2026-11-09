import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { measurementSetsQuery } from "@/lib/api";
import { longDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MeasurementDialog } from "@/components/app/dialogs";
import { Empty, PageHeader } from "@/components/app/ui";

export const Route = createFileRoute("/_authenticated/measurements")({
  loader: ({ context }) => context.queryClient.ensureQueryData(measurementSetsQuery),
  head: () => ({ meta: [{ title: "Measurements — Atelier" }] }),
  component: Measurements,
});

function Measurements() {
  const { data } = useSuspenseQuery(measurementSetsQuery);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const list = data.filter((s) =>
    ((s.customers?.full_name ?? "") + " " + s.garment).toLowerCase().includes(q.toLowerCase()),
  );
  return (
    <div>
      <PageHeader
        title="Measurements"
        sub="Every dated record, never overwritten."
        action={
          <Button variant="hero" onClick={() => setOpen(true)}>
            <Plus />
            Record measurements
          </Button>
        }
      />
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search measurements"
          placeholder="Search customer or garment"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="h-10 bg-card pl-9"
        />
      </div>
      {list.length === 0 ? (
        <Empty
          title="No measurements yet"
          body="Record measurements for a customer to build their history."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {list.map((s) => (
            <div key={s.id} className="surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <Link
                    to="/customers/$id"
                    params={{ id: s.customer_id }}
                    className="font-medium hover:text-primary"
                  >
                    {s.customers?.full_name}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {s.garment} · {s.unit}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{longDate(s.taken_on)}</span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
                {[...s.customer_measurement_values]
                  .sort((a, z) => a.position - z.position)
                  .map((v) => (
                    <div
                      key={v.id}
                      className="flex justify-between border-b border-dashed border-border pb-1"
                    >
                      <dt className="text-muted-foreground">{v.label}</dt>
                      <dd className="tabular">{Number(v.value)}</dd>
                    </div>
                  ))}
              </dl>
            </div>
          ))}
        </div>
      )}
      <MeasurementDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}
