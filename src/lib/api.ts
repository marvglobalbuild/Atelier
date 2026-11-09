// Data access for the authenticated SaaS application.
// All reads and writes are scoped to the authenticated user and their business via Supabase RLS.
import { queryOptions, useMutation, useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { OrderStatus } from "./domain";

export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Customer = Database["public"]["Tables"]["customers"]["Row"];
export type Order = Database["public"]["Tables"]["orders"]["Row"];
export type Payment = Database["public"]["Tables"]["payments"]["Row"];
export type StyleAsset = Database["public"]["Tables"]["style_assets"]["Row"];
export type Collection = Database["public"]["Tables"]["style_collections"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];

function check<T>(r: { data: T | null; error: { message: string } | null }): T {
  if (r.error) throw new Error(r.error.message);
  return r.data as T;
}

export const businessQuery = queryOptions({
  queryKey: ["business"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return null;
    const res = await supabase
      .from("businesses")
      .select("*")
      .eq("owner_id", u.user.id)
      .maybeSingle();
    return res.data;
  },
});

export function useBusiness() {
  const { data } = useSuspenseQuery(businessQuery);
  if (!data) throw new Error("No business profile");
  return data;
}

export const customersQuery = queryOptions({
  queryKey: ["customers"],
  queryFn: async () => {
    const res = await supabase.from("customers").select("*").order("full_name");
    return check(res) ?? [];
  },
});

export const customerQuery = (id: string) =>
  queryOptions({
    queryKey: ["customer", id],
    queryFn: async () => {
      const customer = check(await supabase.from("customers").select("*").eq("id", id).single());
      const sets = check(
        await supabase
          .from("customer_measurement_sets")
          .select("*, customer_measurement_values(*)")
          .eq("customer_id", id)
          .order("taken_on", { ascending: false }),
      );
      const orders = check(
        await supabase
          .from("orders")
          .select("*")
          .eq("customer_id", id)
          .order("created_at", { ascending: false }),
      );
      const styles = check(
        await supabase
          .from("customer_style_assets")
          .select("asset_id, style_assets(*)")
          .eq("customer_id", id),
      );
      return {
        customer,
        sets: sets ?? [],
        orders: orders ?? [],
        styles: (styles ?? []).map((s) => s.style_assets).filter(Boolean) as StyleAsset[],
      };
    },
  });

export type OrderWithCustomer = Order & {
  customers: { id: string; full_name: string } | null;
  payments: { amount: number }[];
};

export const ordersQuery = queryOptions({
  queryKey: ["orders"],
  queryFn: async () => {
    const res = await supabase
      .from("orders")
      .select("*, customers(id, full_name), payments(amount)")
      .order("due_date", { ascending: true, nullsFirst: false });
    return (check(res) ?? []) as unknown as OrderWithCustomer[];
  },
});

export const orderQuery = (id: string) =>
  queryOptions({
    queryKey: ["order", id],
    queryFn: async () => {
      const order = check(
        await supabase
          .from("orders")
          .select("*, customers(id, full_name, phone)")
          .eq("id", id)
          .single(),
      );
      const payments = check(
        await supabase
          .from("payments")
          .select("*")
          .eq("order_id", id)
          .order("paid_on", { ascending: false }),
      );
      const snapshots = check(
        await supabase.from("order_measurement_snapshots").select("*").eq("order_id", id),
      );
      const styles = check(
        await supabase
          .from("order_style_assets")
          .select("asset_id, style_assets(*)")
          .eq("order_id", id),
      );
      return {
        order,
        payments: payments ?? [],
        snapshots: snapshots ?? [],
        styles: (styles ?? []).map((s) => s.style_assets).filter(Boolean) as StyleAsset[],
      };
    },
  });

export const paymentsQuery = queryOptions({
  queryKey: ["payments"],
  queryFn: async () => {
    const res = await supabase
      .from("payments")
      .select("*, orders(id, outfit_name, customers(full_name))")
      .order("paid_on", { ascending: false });
    return check(res) ?? [];
  },
});

export const measurementSetsQuery = queryOptions({
  queryKey: ["measurement-sets"],
  queryFn: async () => {
    const res = await supabase
      .from("customer_measurement_sets")
      .select("*, customers(id, full_name), customer_measurement_values(*)")
      .order("taken_on", { ascending: false });
    return check(res) ?? [];
  },
});

export const stylesQuery = queryOptions({
  queryKey: ["styles"],
  queryFn: async () => {
    const assets =
      check(
        await supabase
          .from("style_assets")
          .select("*, collection_assets(collection_id)")
          .order("created_at", { ascending: false }),
      ) ?? [];
    const collections =
      check(await supabase.from("style_collections").select("*").order("name")) ?? [];

    const urls: Record<string, string> = {};
    const remotePaths: string[] = [];

    for (const a of assets) {
      if (a.storage_path.startsWith("data:") || a.storage_path.startsWith("http")) {
        urls[a.storage_path] = a.storage_path;
      } else {
        remotePaths.push(a.storage_path);
      }
    }

    if (remotePaths.length) {
      try {
        const { data } = await supabase.storage
          .from("style-assets")
          .createSignedUrls(remotePaths, 60 * 60);
        data?.forEach((d) => {
          if (d.path && d.signedUrl) urls[d.path] = d.signedUrl;
        });
      } catch {
        // Storage bucket fallback
      }
    }

    return { assets, collections, urls };
  },
});

export const appointmentsQuery = queryOptions({
  queryKey: ["appointments"],
  queryFn: async () => {
    const res = await supabase
      .from("appointments")
      .select("*, customers(full_name), orders(outfit_name)")
      .order("starts_at");
    return check(res) ?? [];
  },
});

export const templatesQuery = queryOptions({
  queryKey: ["templates"],
  queryFn: async () => {
    const res = await supabase
      .from("measurement_templates")
      .select("*, measurement_fields(*)")
      .order("name");
    const list = check(res) ?? [];
    return list.map((t) => ({
      id: t.id,
      name: t.name,
      fields: (t.measurement_fields ?? [])
        .sort((a, b) => a.position - b.position)
        .map((f) => f.label),
    }));
  },
});

export const activityQuery = queryOptions({
  queryKey: ["activity"],
  queryFn: async () => {
    const res = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(12);
    return check(res) ?? [];
  },
});

export async function logActivity(
  business_id: string,
  entity: string,
  action: string,
  summary: string,
  entity_id?: string,
) {
  try {
    await supabase
      .from("audit_logs")
      .insert({ business_id, entity, action, summary, entity_id: entity_id ?? null });
  } catch {
    // Audit logging is non-blocking
  }
}

export function useInvalidate() {
  const qc = useQueryClient();
  return (...keys: string[]) =>
    Promise.all(keys.map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

export function useUpdateOrderStatus() {
  const inv = useInvalidate();
  return useMutation({
    mutationFn: async ({
      order,
      status,
    }: {
      order: Pick<Order, "id" | "business_id" | "outfit_name">;
      status: OrderStatus;
    }) => {
      check(
        await supabase
          .from("orders")
          .update({
            status,
            delivered_at: status === "delivered" ? new Date().toISOString() : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.id)
          .select(),
      );
      await logActivity(
        order.business_id,
        "order",
        "status",
        `${order.outfit_name} moved to ${status}`,
        order.id,
      );
    },
    onSuccess: () => inv("orders", "order", "customer", "activity"),
  });
}

export { check, supabase };
