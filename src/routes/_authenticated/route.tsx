import {
  createFileRoute,
  Link,
  Outlet,
  redirect,
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { useState } from "react";
import {
  CalendarDays,
  CreditCard,
  Images,
  LayoutGrid,
  LogOut,
  MoreHorizontal,
  Ruler,
  Scissors,
  Settings,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { businessQuery, useBusiness } from "@/lib/api";
import { Logo } from "@/components/marketing/Nav";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context }) => {
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) throw redirect({ to: "/auth", search: { mode: "signin" } });
    } catch (err) {
      if ((err as { to?: string })?.to) throw err;
      throw redirect({ to: "/auth", search: { mode: "signin" } });
    }
    const business = await context.queryClient.ensureQueryData(businessQuery);
    if (!business) throw redirect({ to: "/onboarding" });
  },
  component: AppShell,
  pendingComponent: () => (
    <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
      Opening your workspace…
    </div>
  ),
});

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutGrid },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/measurements", label: "Measurements", icon: Ruler },
  { to: "/style-library", label: "Style Library", icon: Images },
  { to: "/orders", label: "Orders", icon: Scissors },
  { to: "/payments", label: "Payments", icon: CreditCard },
  { to: "/calendar", label: "Calendar", icon: CalendarDays },
  { to: "/settings", label: "Settings", icon: Settings },
] as const;

const MOBILE = ["/dashboard", "/customers", "/orders", "/style-library"] as const;

function AppShell() {
  const business = useBusiness();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [more, setMore] = useState(false);

  async function signOut() {
    await supabase.auth.signOut();
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-sidebar-border bg-sidebar lg:flex">
        <div className="px-5 py-5">
          <Link to="/dashboard">
            <Logo className="text-xl" />
          </Link>
          <p className="mt-1 truncate text-xs text-muted-foreground">{business.name}</p>
        </div>
        <nav className="flex-1 space-y-0.5 px-3">
          {NAV.map((n) => {
            const active = path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-3 rounded-md px-2.5 py-2 text-sm transition-colors",
                  active
                    ? "bg-sidebar-accent font-medium shadow-sm"
                    : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground",
                )}
              >
                <n.icon className={cn("size-4", active && "text-primary")} />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <button
          onClick={signOut}
          className="m-3 flex items-center gap-3 rounded-md px-2.5 py-2 text-sm text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground"
        >
          <LogOut className="size-4" />
          Sign out
        </button>
      </aside>

      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur lg:hidden">
        <Link to="/dashboard">
          <Logo className="text-xl" />
        </Link>
        <span className="max-w-[50%] truncate text-xs text-muted-foreground">{business.name}</span>
      </header>

      <main className="pb-24 lg:pb-0 lg:pl-60">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-10 lg:py-10">
          <Outlet />
        </div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-border bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
        {MOBILE.map((to) => {
          const n = NAV.find((x) => x.to === to)!;
          const active = path.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10px]",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <n.icon className="size-5" />
              {n.label.replace(" Library", "")}
            </Link>
          );
        })}
        <button
          onClick={() => setMore(true)}
          className="flex flex-col items-center gap-1 py-2.5 text-[10px] text-muted-foreground"
        >
          <MoreHorizontal className="size-5" />
          More
        </button>
      </nav>
      <Sheet open={more} onOpenChange={setMore}>
        <SheetContent side="bottom" className="rounded-t-lg">
          <SheetTitle className="font-display text-2xl font-normal">More</SheetTitle>
          <div className="mt-4 grid gap-1">
            {NAV.filter((n) => !(MOBILE as readonly string[]).includes(n.to)).map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setMore(false)}
                className="flex items-center gap-3 rounded-md px-2 py-3 text-base hover:bg-secondary"
              >
                <n.icon className="size-5 text-muted-foreground" />
                {n.label}
              </Link>
            ))}
            <button
              onClick={signOut}
              className="flex items-center gap-3 rounded-md px-2 py-3 text-base hover:bg-secondary"
            >
              <LogOut className="size-5 text-muted-foreground" />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
