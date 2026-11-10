import { createFileRoute } from "@tanstack/react-router";
import { Settings, ShieldCheck, Mail, Database, Terminal, Lock } from "lucide-react";
import { PLATFORM_OWNER_EMAILS } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin/settings")({
  head: () => ({ meta: [{ title: "Platform Settings — Atelier Admin" }] }),
  component: AdminSettingsPage,
});

export function AdminSettingsPage() {
  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">
            Platform Configuration & Security
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Owner authorization whitelist, database connection parameters, and security policies.
          </p>
        </div>
      </div>

      <div className="space-y-5 max-w-3xl">
        {/* Administrator Access Whitelist */}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Lock className="size-4 text-slate-500" />
            <h3 className="text-sm font-semibold text-slate-900">
              Authorized Administrator Accounts
            </h3>
          </div>
          <p className="mt-2 text-xs text-slate-500 leading-relaxed">
            Only users authenticated under these verified email addresses have authorization to
            access the{" "}
            <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-700">
              /admin
            </code>{" "}
            operations suite.
          </p>

          <div className="mt-4 space-y-2">
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
        </div>

        {/* Database & Backend Connectivity */}
        <div className="rounded-lg border border-slate-200 bg-white p-5">
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
