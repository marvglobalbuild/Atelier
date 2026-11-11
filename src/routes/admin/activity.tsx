import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ScrollText,
  Clock,
  Building2,
  Tag,
  Search,
  Download,
  Filter,
  Eye,
  ShieldCheck,
  Terminal,
} from "lucide-react";
import { adminActivityQuery, downloadCsv, PlatformActivityLog } from "@/lib/admin-api";
import { longDate } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/activity")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminActivityQuery),
  head: () => ({ meta: [{ title: "Platform Activity Logs — Atelier Admin" }] }),
  component: AdminActivityPage,
});

export function AdminActivityPage() {
  const { data: logs = [] } = useQuery(adminActivityQuery);
  const [query, setQuery] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<PlatformActivityLog | null>(null);

  const filteredLogs = logs.filter((log) => {
    if (entityFilter !== "all" && log.entity.toLowerCase() !== entityFilter.toLowerCase())
      return false;
    if (actionFilter !== "all" && log.action.toLowerCase() !== actionFilter.toLowerCase())
      return false;
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      log.summary.toLowerCase().includes(q) ||
      log.businessName?.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q)
    );
  });

  const handleExportCsv = () => {
    const exportRows = filteredLogs.map((l) => ({
      Timestamp: l.createdAt,
      Atelier: l.businessName || "Atelier",
      "Business ID": l.businessId,
      Entity: l.entity,
      Action: l.action,
      Summary: l.summary,
      "Log ID": l.id,
    }));
    downloadCsv(`atelier-activity-audit-${new Date().toISOString().slice(0, 10)}.csv`, exportRows);
    toast.success("Audit trail logs exported to CSV");
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Platform Activity & Security Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable audit record of order creations, fitting completions, and atelier operations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportCsv}
            disabled={filteredLogs.length === 0}
            className="h-8 text-xs gap-1.5 border-slate-200"
          >
            <Download className="size-3.5 text-slate-500" />
            <span>Export CSV</span>
          </Button>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded">
            {logs.length} Recent Events
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search activity by atelier, entity, or keyword…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-9 text-xs border-slate-200 bg-white"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700 shadow-sm focus:outline-none"
          >
            <option value="all">All Entities</option>
            <option value="orders">Orders</option>
            <option value="customers">Customers</option>
            <option value="businesses">Businesses</option>
            <option value="payments">Payments</option>
            <option value="appointments">Appointments</option>
          </select>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="h-8 rounded-md border border-slate-200 bg-white px-2.5 text-[11px] text-slate-700 shadow-sm focus:outline-none"
          >
            <option value="all">All Actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[11px] uppercase">
              <tr>
                <th className="py-3 px-4 font-medium">Timestamp</th>
                <th className="py-3 px-4 font-medium">Atelier</th>
                <th className="py-3 px-4 font-medium">Entity</th>
                <th className="py-3 px-4 font-medium">Action</th>
                <th className="py-3 px-4 font-medium">Summary</th>
                <th className="py-3 px-4 font-medium text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Clock className="mx-auto size-6 mb-2 opacity-60" />
                    <p className="font-medium text-slate-600">No matching audit events</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Operational events triggered by ateliers stream to this audit table.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-50/70 transition-colors cursor-pointer"
                  >
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {longDate(log.createdAt)}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800 flex items-center gap-1.5">
                      <Building2 className="size-3 text-slate-400" />
                      <span>{log.businessName}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">{log.entity}</td>
                    <td className="py-3 px-4">
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-mono text-slate-700">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-700 max-w-md truncate">{log.summary}</td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-[11px] text-slate-500"
                      >
                        Inspect
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Inspection Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-md font-sans bg-white p-6 border-slate-200">
          {selectedLog && (
            <>
              <DialogHeader className="border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="size-4 text-slate-700" />
                  <DialogTitle className="text-sm font-semibold text-slate-900">
                    Audit Event Inspection
                  </DialogTitle>
                </div>
                <DialogDescription className="text-xs text-slate-500 font-mono">
                  Event ID: {selectedLog.id}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3 py-3 text-xs">
                <div className="rounded border border-slate-100 bg-slate-50 p-3 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Timestamp:</span>
                    <span className="font-mono text-slate-800">
                      {new Date(selectedLog.createdAt).toISOString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Atelier Name:</span>
                    <span className="font-medium text-slate-900">{selectedLog.businessName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Business ID:</span>
                    <span className="font-mono text-slate-800">{selectedLog.businessId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Entity Affected:</span>
                    <span className="font-mono text-slate-800">{selectedLog.entity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Action Type:</span>
                    <span className="font-mono text-slate-800">{selectedLog.action}</span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-400 block mb-1">Event Summary:</span>
                  <div className="rounded border border-slate-200 bg-white p-3 font-mono text-xs text-slate-800">
                    {selectedLog.summary}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
