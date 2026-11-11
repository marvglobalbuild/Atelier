import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  Settings,
  ShieldCheck,
  Mail,
  Database,
  Terminal,
  Lock,
  Plus,
  Trash2,
  AlertTriangle,
  Save,
  CheckCircle2,
  Globe,
} from "lucide-react";
import {
  PLATFORM_OWNER_EMAILS,
  getCustomAdminEmails,
  addCustomAdminEmail,
  removeCustomAdminEmail,
} from "@/lib/admin-auth";
import { getPlatformSettings, savePlatformSettings, PlatformSettings } from "@/lib/admin-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Platform Settings — Atelier Admin" }] }),
  component: AdminSettingsPage,
});

export function AdminSettingsPage() {
  const [customAdmins, setCustomAdmins] = useState<string[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState("");
  const [settings, setSettings] = useState<PlatformSettings>(getPlatformSettings());

  useEffect(() => {
    setCustomAdmins(getCustomAdminEmails());
  }, []);

  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes("@")) {
      toast.error("Please enter a valid administrator email address.");
      return;
    }
    const clean = newAdminEmail.trim().toLowerCase();
    if (PLATFORM_OWNER_EMAILS.includes(clean) || customAdmins.includes(clean)) {
      toast.info("This email is already on the authorized administrator whitelist.");
      return;
    }
    addCustomAdminEmail(clean);
    setCustomAdmins(getCustomAdminEmails());
    setNewAdminEmail("");
    toast.success(`Administrator ${clean} added to access whitelist.`);
  };

  const handleRemoveAdmin = (email: string) => {
    removeCustomAdminEmail(email);
    setCustomAdmins(getCustomAdminEmails());
    toast.success(`Removed ${email} from administrator whitelist.`);
  };

  const handleSaveSettings = () => {
    savePlatformSettings(settings);
    toast.success("Platform settings updated successfully");
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Platform Configuration & Security
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Owner authorization whitelist, system maintenance controls, and infrastructure
            parameters.
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleSaveSettings}
          className="h-8 text-xs gap-1.5 bg-slate-900 text-white"
        >
          <Save className="size-3.5" />
          <span>Save Changes</span>
        </Button>
      </div>

      <div className="space-y-6 max-w-3xl">
        {/* Administrator Access Whitelist */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lock className="size-4 text-slate-500" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                Authorized Administrator Whitelist
              </h3>
              <p className="text-xs text-slate-500">
                Only authenticated sessions matching these email addresses have access to /admin.
              </p>
            </div>
          </div>

          {/* Fixed Primary Owner */}
          <div className="space-y-2">
            <span className="text-[11px] font-mono uppercase text-slate-400">
              Primary System Owner
            </span>
            {PLATFORM_OWNER_EMAILS.map((email) => (
              <div
                key={email}
                className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
              >
                <div className="flex items-center gap-2">
                  <Mail className="size-3.5 text-slate-400" />
                  <span className="font-mono text-slate-800">{email}</span>
                </div>
                <span className="rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-mono text-emerald-700 border border-emerald-200">
                  Primary Owner
                </span>
              </div>
            ))}
          </div>

          {/* Secondary Administrators */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <span className="text-[11px] font-mono uppercase text-slate-400">
              Secondary Administrators ({customAdmins.length})
            </span>
            {customAdmins.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No secondary administrators configured.
              </p>
            ) : (
              customAdmins.map((email) => (
                <div
                  key={email}
                  className="flex items-center justify-between rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Mail className="size-3.5 text-slate-400" />
                    <span className="font-mono text-slate-800">{email}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveAdmin(email)}
                    className="text-slate-400 hover:text-rose-600 transition-colors p-1"
                    title="Remove administrator"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ))
            )}

            {/* Add Admin Form */}
            <form onSubmit={handleAddAdmin} className="pt-2 flex items-center gap-2">
              <Input
                placeholder="colleague@atelier.com"
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                className="h-8 text-xs max-w-xs border-slate-200"
              />
              <Button
                type="submit"
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1 border-slate-200"
              >
                <Plus className="size-3" />
                <span>Add Admin</span>
              </Button>
            </form>
          </div>
        </div>

        {/* System Maintenance Controls */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <AlertTriangle className="size-4 text-amber-500" />
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                System Maintenance & Outage Controls
              </h3>
              <p className="text-xs text-slate-500">
                Display broadcast announcements or place client workspaces in maintenance mode.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-xs font-medium text-slate-900">Maintenance Broadcast Active</p>
              <p className="text-[11px] text-slate-500">
                Notifies designers of scheduled upgrades or database migration windows.
              </p>
            </div>
            <Switch
              checked={settings.maintenanceMode}
              onCheckedChange={(checked) => setSettings({ ...settings, maintenanceMode: checked })}
            />
          </div>

          {settings.maintenanceMode && (
            <div className="space-y-1.5 pt-2">
              <label className="text-[11px] font-mono uppercase text-slate-400">
                Broadcast Banner Notice
              </label>
              <Input
                value={settings.maintenanceMessage}
                onChange={(e) => setSettings({ ...settings, maintenanceMessage: e.target.value })}
                className="h-9 text-xs border-slate-200 bg-white"
              />
            </div>
          )}
        </div>

        {/* Database & Backend Connectivity */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Database className="size-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">Backend Infrastructure</h3>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="rounded border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-400 block font-mono text-[10px] uppercase">
                Supabase Project ID
              </span>
              <span className="font-mono text-slate-800 font-medium mt-1 block">
                beddphzvrwoyvtmzbeio
              </span>
            </div>

            <div className="rounded border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-400 block font-mono text-[10px] uppercase">
                Cloud Region
              </span>
              <span className="font-mono text-slate-800 font-medium mt-1 block">
                eu-west-1 (Ireland)
              </span>
            </div>

            <div className="rounded border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-400 block font-mono text-[10px] uppercase">
                Database Engine
              </span>
              <span className="font-mono text-slate-800 font-medium mt-1 block">
                PostgreSQL 15 (Supabase Hosted)
              </span>
            </div>

            <div className="rounded border border-slate-100 bg-slate-50 p-3">
              <span className="text-slate-400 block font-mono text-[10px] uppercase">
                Security Model
              </span>
              <span className="font-mono text-slate-800 font-medium mt-1 block">
                Strict Row-Level Security (RLS)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
