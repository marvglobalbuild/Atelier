import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, Ruler, Database, Save, Plus, Download } from "lucide-react";
import { toast } from "sonner";
import { businessQuery, templatesQuery, useBusiness, useInvalidate, supabase } from "@/lib/api";
import { PageHeader, Panel } from "@/components/app/ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const CURRENCIES = [
  { code: "NGN", label: "Nigerian Naira (₦)" },
  { code: "USD", label: "US Dollar ($)" },
  { code: "GBP", label: "British Pound (£)" },
  { code: "EUR", label: "Euro (€)" },
  { code: "GHS", label: "Ghanaian Cedi (GH₵)" },
  { code: "KES", label: "Kenyan Shilling (KSh)" },
  { code: "ZAR", label: "South African Rand (R)" },
  { code: "CAD", label: "Canadian Dollar (CA$)" },
  { code: "AUD", label: "Australian Dollar (A$)" },
];

export const Route = createFileRoute("/_authenticated/settings")({
  validateSearch: (s: Record<string, unknown>): { status?: string; from?: string } => ({
    ...(typeof s.status === "string" ? { status: s.status } : {}),
    ...(typeof s.from === "string" ? { from: s.from } : {}),
  }),
  loader: ({ context }) =>
    Promise.all([
      context.queryClient.ensureQueryData(businessQuery),
      context.queryClient.ensureQueryData(templatesQuery),
    ]),
  head: () => ({ meta: [{ title: "Settings — Atelier" }] }),
  component: SettingsPage,
});

export function SettingsPage() {
  const b = useBusiness();
  const inv = useInvalidate();
  const { data: templates = [] } = useQuery(templatesQuery);

  const [activeTab, setActiveTab] = useState("profile");

  // Profile Form States
  const [name, setName] = useState(b.name);
  const [ownerName, setOwnerName] = useState(b.owner_name);
  const [phone, setPhone] = useState(b.phone ?? "");
  const [email, setEmail] = useState(b.email ?? "");
  const [currency, setCurrency] = useState(b.currency);
  const [measurementUnit, setMeasurementUnit] = useState(b.measurement_unit);
  const [isSaving, setIsSaving] = useState(false);

  // Template Modal States
  const [isNewTemplateOpen, setIsNewTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [templateFieldsStr, setTemplateFieldsStr] = useState("");

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("Atelier name cannot be empty");
    if (!ownerName.trim()) return toast.error("Owner name cannot be empty");

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("businesses")
        .update({
          name: name.trim(),
          owner_name: ownerName.trim(),
          phone: phone.trim() || null,
          email: email.trim() || null,
          currency,
          measurement_unit: measurementUnit,
        })
        .eq("id", b.id);
      if (error) throw error;

      await inv("business");
      toast.success("Atelier settings saved successfully");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to update atelier profile");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return toast.error("Please provide a garment template name");

    const fields = templateFieldsStr
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    if (fields.length === 0) {
      return toast.error("Please enter at least one measurement field (comma separated)");
    }

    try {
      const { data: tpl, error: tplError } = await supabase
        .from("measurement_templates")
        .insert({
          business_id: b.id,
          name: templateName.trim(),
        })
        .select()
        .single();

      if (tplError) throw tplError;

      if (tpl && fields.length > 0) {
        const fieldRows = fields.map((label, idx) => ({
          business_id: b.id,
          template_id: tpl.id,
          label,
          position: idx + 1,
        }));
        const { error: fieldError } = await supabase.from("measurement_fields").insert(fieldRows);
        if (fieldError) throw fieldError;
      }

      await inv("templates");
      toast.success(`Template "${templateName}" added`);
      setIsNewTemplateOpen(false);
      setTemplateName("");
      setTemplateFieldsStr("");
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to add template");
    }
  };

  const handleExportData = async () => {
    try {
      const [customers, orders, payments, appointments, templatesRes] = await Promise.all([
        supabase.from("customers").select("*").eq("business_id", b.id),
        supabase.from("orders").select("*").eq("business_id", b.id),
        supabase.from("payments").select("*").eq("business_id", b.id),
        supabase.from("appointments").select("*").eq("business_id", b.id),
        supabase
          .from("measurement_templates")
          .select("*, measurement_fields(*)")
          .eq("business_id", b.id),
      ]);

      const exportPayload = {
        exported_at: new Date().toISOString(),
        business: b,
        customers: customers.data ?? [],
        orders: orders.data ?? [],
        payments: payments.data ?? [],
        appointments: appointments.data ?? [],
        templates: templatesRes.data ?? [],
      };

      const blob = new Blob([JSON.stringify(exportPayload, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${b.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Atelier data exported to JSON");
    } catch {
      toast.error("Could not export workspace data");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings & Atelier Profile"
        sub="Manage studio details, currency preferences, garment templates, and data backups."
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-secondary/70 p-1">
          <TabsTrigger value="profile" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Building2 className="size-4" /> Studio Profile
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Ruler className="size-4" /> Garment Templates
          </TabsTrigger>
          <TabsTrigger value="data" className="flex items-center gap-1.5 text-xs sm:text-sm">
            <Database className="size-4" /> Data & Backups
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Studio Profile */}
        <TabsContent value="profile">
          <Panel className="p-6 max-w-2xl">
            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <Label htmlFor="at-name">Atelier / Brand Name *</Label>
                <Input
                  id="at-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 h-11"
                />
              </div>

              <div>
                <Label htmlFor="at-owner">Head Designer / Owner Name *</Label>
                <Input
                  id="at-owner"
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className="mt-1 h-11"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="at-phone">Official Phone / WhatsApp</Label>
                  <Input
                    id="at-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 h-11"
                  />
                </div>

                <div>
                  <Label htmlFor="at-email">Studio Email</Label>
                  <Input
                    id="at-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1 h-11"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border">
                <div>
                  <Label htmlFor="at-curr">Default Currency</Label>
                  <select
                    id="at-curr"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="mt-1 h-11 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Prices and order balances will display in this currency.
                  </p>
                </div>

                <div>
                  <Label htmlFor="at-unit">Standard Measurement Unit</Label>
                  <select
                    id="at-unit"
                    value={measurementUnit}
                    onChange={(e) => setMeasurementUnit(e.target.value)}
                    className="mt-1 h-11 w-full rounded-md border border-input bg-card px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  >
                    <option value="cm">Centimetres (cm)</option>
                    <option value="in">Inches (in)</option>
                  </select>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Default unit applied when recording body measurements.
                  </p>
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <Button type="submit" variant="ink" size="lg" disabled={isSaving}>
                  <Save className="size-4 mr-2" />
                  {isSaving ? "Saving…" : "Save Changes"}
                </Button>
              </div>
            </form>
          </Panel>
        </TabsContent>

        {/* Tab 2: Measurement Templates */}
        <TabsContent value="templates">
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-medium">Standard Garment Profiles</h3>
                <p className="text-xs text-muted-foreground">
                  Pre-configured sets of measurement labels used when capturing new clients.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setIsNewTemplateOpen(true)}>
                <Plus className="size-3.5 mr-1" /> Add Template
              </Button>
            </div>

            <div className="grid gap-3">
              {templates.map((tpl) => (
                <Panel key={tpl.id} className="p-4">
                  <div className="flex items-center justify-between pb-2 border-b border-border/50">
                    <h4 className="font-medium text-sm text-foreground">{tpl.name}</h4>
                    <span className="text-xs text-muted-foreground font-mono">
                      {tpl.fields.length} points of measure
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {tpl.fields.map((f) => (
                      <span
                        key={f}
                        className="rounded bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </Panel>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* Tab 3: Data & Backups */}
        <TabsContent value="data">
          <Panel className="p-6 max-w-2xl space-y-6">
            <div>
              <h3 className="text-base font-medium text-foreground">Workspace Export</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Download a complete, offline JSON copy of all your customers, measurements, orders,
                financials, and styles.
              </p>
              <Button variant="outline" className="mt-3" onClick={handleExportData}>
                <Download className="size-4 mr-2" /> Export JSON Archive
              </Button>
            </div>
          </Panel>
        </TabsContent>
      </Tabs>

      {/* New Template Dialog */}
      <Dialog open={isNewTemplateOpen} onOpenChange={setIsNewTemplateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">New Garment Template</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTemplate} className="space-y-4 mt-2">
            <div>
              <Label htmlFor="tpl-name">Garment Type Name *</Label>
              <Input
                id="tpl-name"
                required
                placeholder="e.g. Corset Evening Gown, Buba & Iro…"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="tpl-fields">Measurement Fields (comma separated) *</Label>
              <Input
                id="tpl-fields"
                required
                placeholder="Underbust, Waist, Hip, Apex to Apex, High Hip"
                value={templateFieldsStr}
                onChange={(e) => setTemplateFieldsStr(e.target.value)}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Enter each measurement label separated by commas.
              </p>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsNewTemplateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="ink">
                Create Template
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
