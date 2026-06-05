// lib/admin-auth.js
//
// Admin authentication guards.
// Reads from "admin_session" cookie (scoped to /admin, 4h lifetime).

import { cookies } from "next/headers";
import { hashToken } from "@/lib/auth";
import { findSessionByTokenHash } from "@/lib/db";
import { env } from "@/lib/env";

// Admin sessions are shorter than investor sessions
export const ADMIN_SESSION_TTL_MS = 4 * 60 * 60 * 1000; // 4 hours

/**
 * Cookie options for admin sessions.
 * - HttpOnly: JS cannot read it (XSS protection)
 * - Scoped to /admin: browser won't send it on portal requests
 * - 4 hour expiry
 */
export function adminSessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: ADMIN_SESSION_TTL_MS / 1000,
  };
}

/**
 * Get the current admin from the admin_session cookie.
 * Returns null if no valid admin session.
 */
export async function getCurrentAdmin() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get("admin_session")?.value;
  if (!sessionToken) return null;

  try {
    const sessionRow = await findSessionByTokenHash(hashToken(sessionToken));
    if (!sessionRow || !sessionRow.user) return null;

    const user = sessionRow.user;

    // Re-check role every request (in case it was changed after login)
    if (user.role !== "admin" && user.role !== "super_admin") return null;
    if (user.suspendedAt) return null;

    return user;
  } catch (err) {
    console.error("getCurrentAdmin error:", err);
    return null;
  }
}

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin) {
    throw new Response(
      JSON.stringify({ error: true, message: "Admin authentication required" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  return admin;
}

export async function requireSuperAdmin() {
  const admin = await requireAdmin();

  if (admin.role !== "super_admin") {
    throw new Response(
      JSON.stringify({ error: true, message: "Super admin access required" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  return admin;
}

/**
 * Try-catch wrapper for admin routes.
 *
 *   export async function GET() {
 *     return adminRoute(async () => {
 *       const admin = await requireAdmin();
 *       // ... your logic
 *       return successResponse({ ... });
 *     });
 *   }
 */
export async function adminRoute(handler) {
  try {
    return await handler();
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[adminRoute] Uncaught error:", err);
    return new Response(
      JSON.stringify({ error: true, message: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}

export function isAdmin(user) {
  return user?.role === "admin" || user?.role === "super_admin";
}

export function isSuperAdmin(user) {
  return user?.role === "super_admin";
}