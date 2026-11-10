import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { checkIsAdmin } from "@/lib/admin-auth";

export const Route = createFileRoute("/admin")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data?.user) {
        throw redirect({
          to: "/auth",
          search: { mode: "signin" },
        });
      }

      // Check admin authorization
      const isAuthorized = checkIsAdmin(data.user);
      if (!isAuthorized) {
        // We let the AdminLayout render the security restricted screen,
        // or we can allow the layout to display the detailed restricted screen.
      }
    } catch (err) {
      if ((err as { to?: string })?.to) throw err;
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
