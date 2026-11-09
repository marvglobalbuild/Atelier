import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/marketing/Nav";
import { CURRENCIES } from "@/lib/format";
import { GARMENT_TEMPLATES } from "@/lib/domain";

export const Route = createFileRoute("/onboarding")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth", search: { mode: "signin" } });
    const { data: b } = await supabase
      .from("businesses")
      .select("id")
      .eq("owner_id", data.user.id)
      .maybeSingle();
    if (b) throw redirect({ to: "/dashboard" });
    return { user: data.user };
  },
  head: () => ({
    meta: [
      { title: "Set up your business — Atelier" },
      { name: "description", content: "A two-minute setup for your atelier." },
      { property: "og:title", content: "Set up your business — Atelier" },
      { property: "og:description", content: "A two-minute setup." },
    ],
  }),
  component: Onboarding,
});

function Onboarding() {
  const { user } = Route.useRouteContext();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [f, setF] = useState({
    name: "",
    owner_name: (user.user_metadata?.full_name as string) ?? "",
    phone: "",
    email: user.email ?? "",
    currency: "NGN",
    measurement_unit: "cm",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { data, error } = await supabase
      .from("businesses")
      .insert({ ...f, owner_id: user.id })
      .select()
      .single();
    if (error) {
      setBusy(false);
      return toast.error(error.message);
    }
    // Seed garment templates so measurements work immediately.
    for (const [name, fields] of Object.entries(GARMENT_TEMPLATES)) {
      if (!fields.length) continue;
      const { data: t } = await supabase
        .from("measurement_templates")
        .insert({ business_id: data.id, name })
        .select()
        .single();
      if (t) {
        await supabase.from("measurement_fields").insert(
          fields.map((label, position) => ({
            business_id: data.id,
            template_id: t.id,
            label,
            position,
          })),
        );
      }
    }
    await qc.invalidateQueries({ queryKey: ["business"] });
    navigate({ to: "/dashboard" });
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col px-6 py-10">
      <Logo />
      <div className="flex flex-1 flex-col justify-center py-10">
        <p className="eyebrow">Step 1 of 1</p>
        <h1 className="font-display mt-3 text-5xl">Set up your atelier</h1>
        <p className="mt-3 text-muted-foreground">
          Just the essentials — you can change these later in Settings.
        </p>
        <form onSubmit={submit} className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="bn">Business name</Label>
            <Input id="bn" required value={f.name} onChange={set("name")} className="h-11" />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="on">Your name</Label>
            <Input
              id="on"
              required
              value={f.owner_name}
              onChange={set("owner_name")}
              className="h-11"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ph">Phone</Label>
            <Input id="ph" type="tel" value={f.phone} onChange={set("phone")} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="em">Email</Label>
            <Input id="em" type="email" value={f.email} onChange={set("email")} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cu">Currency</Label>
            <select
              id="cu"
              value={f.currency}
              onChange={set("currency")}
              className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              {CURRENCIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="un">Measurements in</Label>
            <select
              id="un"
              value={f.measurement_unit}
              onChange={set("measurement_unit")}
              className="h-11 w-full rounded-md border border-input bg-card px-3 text-sm"
            >
              <option value="cm">Centimetres</option>
              <option value="in">Inches</option>
            </select>
          </div>
          <Button variant="ink" size="xl" className="mt-4 sm:col-span-2" disabled={busy}>
            {busy ? "Setting up…" : "Open my workspace"}
          </Button>
        </form>
      </div>
    </div>
  );
}
