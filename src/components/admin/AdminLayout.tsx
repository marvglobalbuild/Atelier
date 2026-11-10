import { Link, useRouterState, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  BarChart3,
  Activity,
  DollarSign,
  ScrollText,
  HeartPulse,
  Settings,
  ShieldCheck,
  ChevronRight,
  LogOut,
  Menu,
  X,
  ExternalLink,
  ShieldAlert,
} from "lucide-react";
import { useAdminAuth } from "@/lib/admin-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const ADMIN_NAVIGATION: NavSection[] = [
  {
    title: "OVERVIEW",
    items: [{ to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true }],
  },
  {
    title: "MANAGEMENT",
    items: [
      { to: "/admin/users", label: "Users", icon: Users },
      { to: "/admin/subscriptions", label: "Subscriptions", icon: CreditCard },
    ],
  },
  {
    title: "INTELLIGENCE",
    items: [
      { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
      { to: "/admin/usage", label: "Product Usage", icon: Activity },
      { to: "/admin/revenue", label: "Revenue", icon: DollarSign },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { to: "/admin/activity", label: "Activity Logs", icon: ScrollText },
      { to: "/admin/health", label: "Platform Health", icon: HeartPulse },
    ],
  },
  {
    title: "CONFIGURATION",
    items: [{ to: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAdminAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans text-slate-600">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
          <div className="size-4 animate-spin rounded-full border-2 border-slate-900 border-t-transparent" />
          <span className="text-xs font-medium tracking-tight">
            Verifying platform administrator credentials…
          </span>
        </div>
      </div>
    );
  }

  // Unauthorized state: Security enforcement
  if (!user || !isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4 font-sans text-slate-900">
        <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex size-12 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 text-amber-700">
            <ShieldAlert className="size-6" />
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-slate-900">
            Platform Owner Access Restricted
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-600">
            {user
              ? `You are signed in as ${user.email}, which does not possess platform owner administrative privileges.`
              : "Authentication is required to access the Atelier platform administration environment."}
          </p>

          <div className="mt-6 flex flex-col gap-2.5">
            {user ? (
              <>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full justify-center border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
                >
                  <LogOut className="mr-2 size-3.5" />
                  Sign Out & Switch Account
                </Button>
                <Link
                  to="/dashboard"
                  className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
                >
                  Return to Designer Atelier
                </Link>
              </>
            ) : (
              <Link
                to="/auth"
                search={{ mode: "signin" }}
                className="inline-flex w-full items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-slate-800"
              >
                Sign In to Platform Admin
              </Link>
            )}
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 text-center">
            <span className="text-[11px] text-slate-400">
              Atelier Platform Infrastructure · Security Level 1
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Active breadcrumb
  const currentNav = ADMIN_NAVIGATION.flatMap((s) => s.items).find((item) =>
    item.exact ? path === item.to : path.startsWith(item.to),
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-slate-200">
      {/* Desktop Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200/90 bg-white lg:flex">
        {/* Brand header */}
        <div className="flex h-14 items-center justify-between border-b border-slate-200/80 px-4">
          <Link to="/admin" className="flex items-center gap-2.5">
            <div className="flex size-7 items-center justify-center rounded bg-slate-900 text-white shadow-sm">
              <ShieldCheck className="size-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-semibold tracking-tight text-slate-900">
                Atelier Operations
              </span>
              <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                Owner Console
              </span>
            </div>
          </Link>
          <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[10px] font-mono font-medium text-emerald-700">
            PROD
          </span>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-4">
          {ADMIN_NAVIGATION.map((section) => (
            <div key={section.title} className="mb-6 last:mb-0">
              <h2 className="px-2.5 text-[10px] font-mono font-medium tracking-wider text-slate-400 uppercase">
                {section.title}
              </h2>
              <div className="mt-1.5 space-y-0.5">
                {section.items.map((item) => {
                  const active = item.exact ? path === item.to : path.startsWith(item.to);
                  return (
                    <Link
                      key={item.to}
                      to={item.to}
                      className={cn(
                        "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors",
                        active
                          ? "bg-slate-100 text-slate-900 font-semibold"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                      )}
                    >
                      <item.icon
                        className={cn(
                          "size-4 shrink-0 transition-colors",
                          active ? "text-slate-900" : "text-slate-400 group-hover:text-slate-600",
                        )}
                      />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* User profile & designer app switcher footer */}
        <div className="border-t border-slate-200/80 bg-slate-50/50 p-3">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1 pr-2">
              <p className="truncate text-xs font-medium text-slate-800">{user.email}</p>
              <p className="text-[10px] font-mono text-slate-400">Platform Owner</p>
            </div>
            <button
              onClick={handleSignOut}
              className="rounded p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
              title="Sign out of Admin"
            >
              <LogOut className="size-3.5" />
            </button>
          </div>
          <Link
            to="/dashboard"
            className="mt-2.5 flex w-full items-center justify-between rounded border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-slate-900"
          >
            <span>Designer Workspace</span>
            <ExternalLink className="size-3 text-slate-400" />
          </Link>
        </div>
      </aside>

      {/* Main Container */}
      <div className="lg:pl-64">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
              aria-label="Toggle admin navigation"
            >
              {mobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
            </button>

            {/* Breadcrumb path */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Link to="/admin" className="font-medium text-slate-600 hover:text-slate-900">
                Atelier
              </Link>
              <ChevronRight className="size-3 text-slate-400" />
              <span className="font-medium text-slate-900">{currentNav?.label || "Console"}</span>
            </div>
          </div>

          {/* Right Header indicators */}
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] text-slate-600 sm:flex">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>All Systems Normal</span>
            </div>

            <Link
              to="/"
              className="text-xs text-slate-500 hover:text-slate-900"
              title="Public Landing Page"
            >
              Public Site
            </Link>
          </div>
        </header>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 top-14 z-40 bg-slate-900/40 backdrop-blur-sm lg:hidden">
            <div className="h-[calc(100vh-3.5rem)] w-72 overflow-y-auto border-r border-slate-200 bg-white p-4">
              {ADMIN_NAVIGATION.map((section) => (
                <div key={section.title} className="mb-5">
                  <h3 className="px-2 text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                    {section.title}
                  </h3>
                  <div className="mt-1 space-y-0.5">
                    {section.items.map((item) => {
                      const active = item.exact ? path === item.to : path.startsWith(item.to);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-xs font-medium",
                            active
                              ? "bg-slate-100 text-slate-900 font-semibold"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                          )}
                        >
                          <item.icon className="size-4" />
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ))}
              <div className="mt-6 border-t border-slate-200 pt-4">
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-between py-2 text-xs text-slate-600"
                >
                  <span>Designer Workspace</span>
                  <ExternalLink className="size-3.5" />
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 py-2 text-xs text-rose-600"
                >
                  <LogOut className="size-3.5" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Page Content Viewport */}
        <main className="p-4 sm:p-6 md:p-8 max-w-7xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
