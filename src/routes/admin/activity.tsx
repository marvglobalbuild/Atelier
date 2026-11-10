import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ScrollText, Clock, Building2, Tag } from "lucide-react";
import { adminActivityQuery } from "@/lib/admin-api";
import { longDate } from "@/lib/format";

export const Route = createFileRoute("/admin/activity")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminActivityQuery),
  head: () => ({ meta: [{ title: "Platform Activity Logs — Atelier Admin" }] }),
  component: AdminActivityPage,
});

export function AdminActivityPage() {
  const { data: logs = [] } = useQuery(adminActivityQuery);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Platform Activity & Security Audit Logs
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable audit record of order creations, fitting completions, and atelier operations.
          </p>
        </div>
        <span className="text-xs font-mono text-slate-500">{logs.length} Recent Events</span>
      </div>

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
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Clock className="mx-auto size-6 mb-2 opacity-60" />
                    <p className="font-medium text-slate-600">No audit events recorded</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Operational events triggered by ateliers stream to this audit table.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
