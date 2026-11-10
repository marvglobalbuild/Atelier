import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

// Whitelisted platform administrator email accounts.
// Can be customized via environment variable VITE_PLATFORM_ADMIN_EMAILS (comma-separated).
const ENV_ADMIN_EMAILS =
  typeof import.meta !== "undefined" && import.meta.env?.VITE_PLATFORM_ADMIN_EMAILS
    ? String(import.meta.env.VITE_PLATFORM_ADMIN_EMAILS)
        .split(",")
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean)
    : [];

export const PLATFORM_OWNER_EMAILS: string[] = Array.from(
  new Set([
    "missaigurl@gmail.com", // Platform owner
    ...ENV_ADMIN_EMAILS,
  ]),
);

/**
 * Validates if the authenticated user has platform administration privileges.
 * Enforces role-based and identity-based authorization checks.
 */
export function checkIsAdmin(user: User | null): boolean {
  if (!user || !user.email) return false;

  const email = user.email.toLowerCase();

  // 1. Explicit owner email whitelist check
  if (PLATFORM_OWNER_EMAILS.includes(email)) {
    return true;
  }

  // 2. User metadata or app_metadata role check (assigned via Supabase dashboard / backend)
  const appRole = (user.app_metadata as { role?: string } | undefined)?.role;
  const userRole = (user.user_metadata as { role?: string } | undefined)?.role;

  if (appRole === "platform_admin" || appRole === "admin" || userRole === "platform_admin") {
    return true;
  }

  return false;
}

export function useAdminAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function evaluateAuth() {
      try {
        const { data } = await supabase.auth.getUser();
        if (!mounted) return;
        const currentUser = data?.user ?? null;
        setUser(currentUser);
        setIsAdmin(checkIsAdmin(currentUser));
      } catch {
        if (!mounted) return;
        setUser(null);
        setIsAdmin(false);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    evaluateAuth();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const currentUser = session?.user ?? null;
      setUser(currentUser);
      setIsAdmin(checkIsAdmin(currentUser));
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  return { user, isAdmin, loading };
}
