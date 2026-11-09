import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  check,
  customerQuery,
  logActivity,
  stylesQuery,
  useBusiness,
  useInvalidate,
} from "@/lib/api";
import { initials, longDate, money, shortDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CustomerDialog, MeasurementDialog, OrderDialog } from "@/components/app/dialogs";
import { Empty, StatusBadge } from "@/components/app/ui";

export const Route = createFileRoute("/_authenticated/customers/$id")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(customerQuery(params.id)),
  head: () => ({ meta: [{ title: "Customer — Atelier" }] }),
  component: CustomerPage,
});

function CustomerPage() {
  const { id } = Route.useParams();
  const b = useBusiness();
  const inv = useInvalidate();
  const { data } = useSuspenseQuery(customerQuery(id));
  const { data: lib } = useQuery(stylesQuery);
  const { customer: c, sets, orders, styles } = data;
  const [edit, setEdit] = useState(false);
  const [meas, setMeas] = useState(false);
  const [order, setOrder] = useState(false);

  async function toggleArchive() {
    const archived_at = c.archived_at ? null : new Date().toISOString();
    try {
      check(await supabase.from("customers").update({ archived_at }).eq("id", c.id).select());
      await logActivity(
        b.id,
        "customer",
        archived_at ? "archive" : "restore",
        `${archived_at ? "Archived" : "Restored"} ${c.full_name}`,
        c.id,
      );
      await inv("customers", "customer", "activity");
      toast.success(
        archived_at ? "Customer archived — their orders are kept" : "Customer restored",
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div>
      <Link
        to="/customers"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Customers
      </Link>
      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <span className="font-display grid size-14 place-items-center rounded-full bg-wine-soft text-xl text-primary">
            {initials(c.full_name)}
          </span>
          <div>
            <h1 className="font-display text-3xl sm:text-4xl">{c.full_name}</h1>
            <p className="text-sm text-muted-foreground">
              {[c.phone, c.email].filter(Boolean).join(" · ") || "No contact details"}
              {c.archived_at && " · Archived"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="quiet" size="sm" onClick={() => setEdit(true)}>
            Edit
          </Button>
          <Button variant="quiet" size="sm" onClick={toggleArchive}>
            {c.archived_at ? "Restore" : "Archive"}
          </Button>
          {!c.archived_at && (
            <Button variant="hero" size="sm" onClick={() => setOrder(true)}>
              New order
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="measurements" className="mt-8">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
          {[
            ["measurements", `Measurements (${sets.length})`],
            ["orders", `Orders (${orders.length})`],
            ["inspiration", `Inspiration (${styles.length})`],
            ["profile", "Profile"],
          ].map(([v, l]) => (
            <TabsTrigger
              key={v}
              value={v}
              className="rounded-none border-b-2 border-transparent px-3 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="measurements" className="mt-6">
          <div className="mb-4 flex justify-end">
            <Button variant="ink" size="sm" onClick={() => setMeas(true)}>
              Record measurements
            </Button>
          </div>
          {sets.length === 0 ? (
            <Empty
              title="No measurements yet"
              body="Record a dated set using a garment template or your own fields."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {sets.map((s, i) => (
                <div key={s.id} className={"surface p-4 " + (i === 0 ? "border-primary/40" : "")}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{s.garment}</span>
                    <span className="text-muted-foreground">
                      {longDate(s.taken_on)}
                      {i === 0 && " · latest"}
                    </span>
                  </div>
                  <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                    {[...s.customer_measurement_values]
                      .sort((a, z) => a.position - z.position)
                      .map((v) => (
                        <div
                          key={v.id}
                          className="flex justify-between border-b border-dashed border-border pb-1"
                        >
                          <dt className="text-muted-foreground">{v.label}</dt>
                          <dd className="tabular font-medium">
                            {Number(v.value)} {s.unit}
                          </dd>
                        </div>
                      ))}
                  </dl>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="orders" className="mt-6">
          {orders.length === 0 ? (
            <Empty title="No orders yet" body="Orders for this customer will appear here." />
          ) : (
            <div className="surface divide-y divide-border">
              {orders.map((o) => (
                <Link
                  key={o.id}
                  to="/orders/$id"
                  params={{ id: o.id }}
                  className="flex items-center justify-between gap-3 px-4 py-3 text-sm hover:bg-secondary/40"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{o.outfit_name}</p>
                    <p className="text-xs text-muted-foreground">
                      Due {shortDate(o.due_date)} · {money(Number(o.price), b.currency)}
                    </p>
                  </div>
                  <StatusBadge status={o.status} />
                </Link>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="inspiration" className="mt-6">
          {styles.length === 0 ? (
            <Empty
              title="No linked inspiration"
              body="Open an image in the Style Library and link it to this customer."
            />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {styles.map((s) => (
                <figure key={s.id}>
                  {lib?.urls[s.storage_path] ? (
                    <img
                      src={lib.urls[s.storage_path]}
                      alt={s.title}
                      className="aspect-[3/4] w-full rounded-sm object-cover"
                    />
                  ) : (
                    <div className="aspect-[3/4] rounded-sm bg-secondary" />
                  )}
                  <figcaption className="mt-1.5 truncate text-sm">{s.title}</figcaption>
                </figure>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <dl className="surface grid gap-4 p-5 text-sm sm:grid-cols-2">
            {[
              ["Phone", c.phone],
              ["Email", c.email],
              ["Address", c.address],
              ["Customer since", longDate(c.created_at)],
              ["Notes", c.notes],
            ].map(([k, v]) => (
              <div key={k as string} className={k === "Notes" ? "sm:col-span-2" : ""}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="mt-1 whitespace-pre-wrap">{v || "—"}</dd>
              </div>
            ))}
          </dl>
        </TabsContent>
      </Tabs>

      <CustomerDialog open={edit} onOpenChange={setEdit} customer={c} />
      <MeasurementDialog open={meas} onOpenChange={setMeas} customerId={c.id} />
      <OrderDialog open={order} onOpenChange={setOrder} customerId={c.id} />
    </div>
  );
}
