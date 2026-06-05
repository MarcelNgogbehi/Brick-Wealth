"use client";

// Shared client hook: resolves the visitor's logged-in state for public-site
// chrome (navbar + footer). Swaps "Login / Register" for a "Dashboard" link
// once a session is active. Re-checked on every route change so it updates
// right after login/logout. Admins are routed to the admin console instead.

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export function useAuthSession() {
  const pathname = usePathname();
  const [session, setSession] = useState(null); // null = still loading

  useEffect(() => {
    let dead = false;
    fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!dead) setSession(d || { authenticated: false }); })
      .catch(() => { if (!dead) setSession({ authenticated: false }); });
    return () => { dead = true; };
  }, [pathname]);

  const authenticated = !!session?.authenticated;
  const role = session?.user?.role;
  const isAdmin = role === "admin" || role === "super_admin";
  return {
    authenticated,
    isAdmin,
    dashboardHref: isAdmin ? "/admin" : "/dashboard",
    dashboardLabel: isAdmin ? "Admin Console" : "Investor Dashboard",
  };
}
