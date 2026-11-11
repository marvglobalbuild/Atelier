import { createFileRoute, Outlet, redirect, isRedirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin")({
  ssr: false,
  pendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans text-xs text-slate-500">
      Loading admin operations console…
    </div>
  ),
  beforeLoad: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        throw redirect({
          to: "/auth",
          search: { mode: "signin" },
        });
      }
    } catch (err) {
      if (isRedirect(err)) throw err;
      throw redirect({ to: "/auth", search: { mode: "signin" } });
    }
  },
  head: () => ({
    meta: [
      { title: "Platform Operations Console — Atelier" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: AdminShellRoute,
});

function AdminShellRoute() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}
