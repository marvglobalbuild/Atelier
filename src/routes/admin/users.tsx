import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  Users,
  Search,
  Building2,
  Calendar,
  Mail,
  Phone,
  Scissors,
  DollarSign,
  Download,
  Filter,
  CheckCircle2,
  Ban,
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  CreditCard,
  UserCheck,
} from "lucide-react";
import {
  adminUsersQuery,
  adminOverviewQuery,
  saveTenantOverride,
  downloadCsv,
  AdminUserRecord,
  SubscriptionTier,
  TenantStatus,
} from "@/lib/admin-api";
import { shortDate, money } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/users")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminUsersQuery),
  head: () => ({ meta: [{ title: "User & Atelier Management — Atelier Admin" }] }),
  component: AdminUsersPage,
});

export function AdminUsersPage() {
  const queryClient = useQueryClient();
  const { data: users = [] } = useQuery(adminUsersQuery);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "suspended">("all");
  const [tierFilter, setTierFilter] = useState<"all" | SubscriptionTier>("all");
  const [selectedUser, setSelectedUser] = useState<AdminUserRecord | null>(null);

  // Filtered dataset
  const filtered = users.filter((u) => {
    if (statusFilter !== "all" && u.status !== statusFilter) return false;
    if (tierFilter !== "all" && u.tier !== tierFilter) return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      u.businessName?.toLowerCase().includes(q) ||
      u.ownerName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    const exportRows = filtered.map((u) => ({
      "Atelier Name": u.businessName || "Unnamed Atelier",
      "Owner Name": u.ownerName || "",
      Email: u.email || "",
      Phone: u.phone || "",
      Plan: u.tier,
      Status: u.status,
      "Orders Count": u.orderCount,
      "Customers Count": u.customerCount,
      "Total GMV": u.totalRevenue,
      Currency: u.currency,
      "Measurement Unit": u.measurementUnit,
      "Created At": u.createdAt,
    }));
    downloadCsv(`atelier-tenants-export-${new Date().toISOString().slice(0, 10)}.csv`, exportRows);
    toast.success("Tenant directory exported to CSV");
  };

  const handleUpdateTier = (tier: SubscriptionTier) => {
    if (!selectedUser) return;
    saveTenantOverride(selectedUser.id, { tier });
    setSelectedUser({ ...selectedUser, tier });
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    toast.success(`Plan updated to ${tier.toUpperCase()} for ${selectedUser.businessName}`);
  };

  const handleToggleStatus = (status: TenantStatus) => {
    if (!selectedUser) return;
    saveTenantOverride(selectedUser.id, { status });
    setSelectedUser({ ...selectedUser, status });
    queryClient.invalidateQueries({ queryKey: ["admin"] });
    toast.success(
      `Atelier status updated to ${status === "active" ? "Active" : "Suspended"} for ${selectedUser.businessName}`,
    );
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            User & Atelier Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of registered fashion designers, bespoke tailors, and multi-tenant workspaces.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filtered.length === 0}
            className="h-8 text-xs gap-1.5 border-slate-200"
          >
            <Download className="size-3.5 text-slate-500" />
            <span>Export CSV</span>
          </Button>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {users.length} Total Accounts
          </span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by atelier, designer, email, or phone…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-9 text-xs border-slate-200 bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <div className="inline-flex rounded-md border border-slate-200 bg-white p-0.5 text-xs shadow-sm">
            <button
              onClick={() => setStatusFilter("all")}
              className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                statusFilter === "all"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All Status
            </button>
            <button
              onClick={() => setStatusFilter("active")}
              className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                statusFilter === "active"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setStatusFilter("suspended")}
              className={`rounded px-2.5 py-1 text-[11px] font-medium transition-colors ${
                statusFilter === "suspended"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Suspended
            </button>
          </div>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as "all" | SubscriptionTier)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700 shadow-sm focus:outline-none"
          >
            <option value="all">All Plans</option>
            <option value="free">Community (Free)</option>
            <option value="pro">Maison Studio ($29)</option>
            <option value="enterprise">Fashion House ($99)</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4 font-medium">Atelier / Brand</th>
                <th className="py-3 px-4 font-medium">Designer</th>
                <th className="py-3 px-4 font-medium">Contact</th>
                <th className="py-3 px-4 font-medium">Subscription</th>
                <th className="py-3 px-4 font-medium">Orders / Clients</th>
                <th className="py-3 px-4 font-medium">GMV Recorded</th>
                <th className="py-3 px-4 font-medium">Created</th>
                <th className="py-3 px-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <Users className="mx-auto size-6 mb-2 opacity-60" />
                    <p className="font-medium text-slate-600">
                      No registered ateliers matching filters
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {query
                        ? "Try adjusting your search terms."
                        : "New registrations will appear here."}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr
                    key={u.id}
                    onClick={() => setSelectedUser(u)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer group"
                  >
                    <td className="py-3 px-4 font-medium text-slate-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-3.5 text-slate-400 group-hover:text-slate-900 transition-colors" />
                        <span>{u.businessName || "Unnamed Atelier"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{u.ownerName || "—"}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      <div>{u.email || "—"}</div>
                      {u.phone && <div className="text-[10px] text-slate-400">{u.phone}</div>}
                    </td>
                    <td className="py-3 px-4">
                      {u.tier === "enterprise" ? (
                        <span className="inline-flex items-center gap-1 rounded bg-purple-50 px-2 py-0.5 text-[10px] font-medium text-purple-700 border border-purple-200">
                          Fashion House
                        </span>
                      ) : u.tier === "pro" ? (
                        <span className="inline-flex items-center gap-1 rounded bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 border border-blue-200">
                          Maison Studio
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                          Community Free
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-700 text-[11px]">
                      {u.orderCount} orders · {u.customerCount} clients
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-900 font-medium">
                      {money(u.totalRevenue, u.currency)}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {shortDate(u.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {u.status === "suspended" ? (
                          <span className="inline-flex items-center gap-1 rounded bg-rose-50 px-2 py-0.5 text-[10px] font-medium text-rose-700 border border-rose-200">
                            Suspended
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200/60">
                            Active
                          </span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-[11px] text-slate-600"
                        >
                          Inspect
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Atelier Inspection & Management Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={(open) => !open && setSelectedUser(null)}>
        <DialogContent className="max-w-xl font-sans bg-white p-6 border-slate-200">
          {selectedUser && (
            <>
              <DialogHeader className="border-b border-slate-100 pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="size-4 text-slate-700" />
                    <DialogTitle className="text-base font-semibold text-slate-900">
                      {selectedUser.businessName || "Unnamed Atelier"}
                    </DialogTitle>
                  </div>
                  <span
                    className={`rounded px-2 py-0.5 text-[10px] font-mono font-medium ${
                      selectedUser.status === "active"
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-rose-50 text-rose-700 border border-rose-200"
                    }`}
                  >
                    {selectedUser.status.toUpperCase()}
                  </span>
                </div>
                <DialogDescription className="text-xs text-slate-500 mt-1 font-mono">
                  ID: {selectedUser.id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-5 py-3 text-xs">
                {/* Metrics Breakdown */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Total Orders
                    </span>
                    <span className="mt-1 block font-mono text-lg font-semibold text-slate-900">
                      {selectedUser.orderCount}
                    </span>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Clients Onboarded
                    </span>
                    <span className="mt-1 block font-mono text-lg font-semibold text-slate-900">
                      {selectedUser.customerCount}
                    </span>
                  </div>
                  <div className="rounded-md border border-slate-100 bg-slate-50 p-3">
                    <span className="text-[10px] font-mono uppercase text-slate-400 block">
                      Volume Processed
                    </span>
                    <span className="mt-1 block font-mono text-base font-semibold text-slate-900">
                      {money(selectedUser.totalRevenue, selectedUser.currency)}
                    </span>
                  </div>
                </div>

                {/* Account Details */}
                <div className="rounded-md border border-slate-200 p-3 space-y-2">
                  <h4 className="text-[11px] font-mono uppercase text-slate-400">
                    Designer Profile
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400">Owner Name:</span>{" "}
                      <span className="font-medium text-slate-800">
                        {selectedUser.ownerName || "—"}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Currency / Unit:</span>{" "}
                      <span className="font-mono text-slate-800">
                        {selectedUser.currency} · {selectedUser.measurementUnit}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Email:</span>{" "}
                      <span className="font-mono text-slate-800">{selectedUser.email || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Phone:</span>{" "}
                      <span className="font-mono text-slate-800">{selectedUser.phone || "—"}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Member Since:</span>{" "}
                      <span className="font-mono text-slate-800">
                        {shortDate(selectedUser.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Subscription Tier Administration */}
                <div className="rounded-md border border-slate-200 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-semibold text-slate-900">Subscription Tier</h4>
                      <p className="text-[11px] text-slate-500">
                        Manually assign tier access for this tenant
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant={selectedUser.tier === "free" ? "default" : "outline"}
                        onClick={() => handleUpdateTier("free")}
                        className="h-7 text-[11px] px-2.5"
                      >
                        Free
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedUser.tier === "pro" ? "default" : "outline"}
                        onClick={() => handleUpdateTier("pro")}
                        className="h-7 text-[11px] px-2.5"
                      >
                        Maison ($29)
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedUser.tier === "enterprise" ? "default" : "outline"}
                        onClick={() => handleUpdateTier("enterprise")}
                        className="h-7 text-[11px] px-2.5"
                      >
                        House ($99)
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Account Suspension Control */}
                <div className="rounded-md border border-slate-200 p-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900">Access Control</h4>
                    <p className="text-[11px] text-slate-500">
                      Temporarily freeze or activate this tenant workspace
                    </p>
                  </div>
                  {selectedUser.status === "active" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus("suspended")}
                      className="h-7 text-[11px] text-rose-700 border-rose-200 hover:bg-rose-50"
                    >
                      <Ban className="size-3 mr-1" />
                      Suspend Workspace
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleStatus("active")}
                      className="h-7 text-[11px] text-emerald-700 border-emerald-200 hover:bg-emerald-50"
                    >
                      <CheckCircle2 className="size-3 mr-1" />
                      Reactivate Workspace
                    </Button>
                  )}
                </div>
              </div>

              <DialogFooter className="border-t border-slate-100 pt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const dataStr =
                      "data:text/json;charset=utf-8," +
                      encodeURIComponent(JSON.stringify(selectedUser, null, 2));
                    const downloadAnchor = document.createElement("a");
                    downloadAnchor.setAttribute("href", dataStr);
                    downloadAnchor.setAttribute(
                      "download",
                      `atelier-${selectedUser.id.slice(0, 8)}.json`,
                    );
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    toast.success("Atelier JSON record exported");
                  }}
                  className="h-8 text-xs border-slate-200 text-slate-600"
                >
                  <Download className="size-3 mr-1.5" />
                  Export JSON
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setSelectedUser(null)}
                  className="h-8 text-xs bg-slate-900 text-white"
                >
                  Done
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
