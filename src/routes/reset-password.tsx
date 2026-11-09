import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/marketing/Nav";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Set a new password — Atelier" },
      { name: "description", content: "Choose a new password for your Atelier account." },
      { property: "og:title", content: "Set a new password — Atelier" },
      { property: "og:description", content: "Choose a new password." },
    ],
  }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6">
      <Logo />
      <h1 className="font-display mt-10 text-4xl">Set a new password</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="pw">New password</Label>
          <Input
            id="pw"
            type="password"
            minLength={8}
            required
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            className="h-11"
          />
        </div>
        <Button variant="ink" size="xl" className="w-full" disabled={busy}>
          Update password
        </Button>
      </form>
    </div>
  );
}
