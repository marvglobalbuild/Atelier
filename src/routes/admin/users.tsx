import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Users, Search, Building2, Calendar, ShieldCheck, Mail } from "lucide-react";
import { adminUsersQuery } from "@/lib/admin-api";
import { shortDate } from "@/lib/format";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/admin/users")({
  loader: ({ context }) => context.queryClient.ensureQueryData(adminUsersQuery),
  head: () => ({ meta: [{ title: "User Management — Atelier Admin" }] }),
  component: AdminUsersPage,
});

export function AdminUsersPage() {
  const { data: users = [] } = useQuery(adminUsersQuery);
  const [query, setQuery] = useState("");

  const filtered = users.filter((u) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      u.businessName?.toLowerCase().includes(q) ||
      u.ownerName?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            User & Atelier Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Directory of registered fashion designers, tailors, and business profiles.
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500">
          <span>{users.length} Total Accounts</span>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by atelier, owner, or email…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-9 text-xs border-slate-200 bg-white"
          />
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
                <th className="py-3 px-4 font-medium">Email</th>
                <th className="py-3 px-4 font-medium">Currency / Unit</th>
                <th className="py-3 px-4 font-medium">Created</th>
                <th className="py-3 px-4 font-medium text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="mx-auto size-6 mb-2 opacity-60" />
                    <p className="font-medium text-slate-600">
                      No registered users matching search
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      User accounts created during designer onboarding appear here.
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-medium text-slate-900 flex items-center gap-2">
                      <Building2 className="size-3.5 text-slate-400" />
                      <span>{u.businessName || "Unnamed Atelier"}</span>
                    </td>
                    <td className="py-3 px-4 text-slate-700">{u.ownerName || "—"}</td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {u.email || "—"}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                      {u.currency} · {u.measurementUnit}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {shortDate(u.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-medium text-emerald-700 border border-emerald-200/60 font-mono">
                        Active
                      </span>
                    </td>
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
