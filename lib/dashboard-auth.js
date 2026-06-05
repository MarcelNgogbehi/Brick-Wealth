// lib/dashboard-auth.js
//
// Auth middleware for the investor dashboard.
// Reads the `session_token` cookie (investor session).
//
// Separate from lib/admin-auth.js which reads `admin_session`.

import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { hashToken } from "@/lib/auth";
import { findSessionByTokenHash } from "@/lib/db";

const SESSION_COOKIE_NAME = "session_token";

/**
 * Verify the investor session and return the user.
 * Throws NEXT_REDIRECT on auth failure (for server components/layouts).
 * Throws Error for API routes (caught by dashboardRoute wrapper).
 *
 * @param {Object} opts
 * @param {boolean} opts.redirect  If true, redirect to /portal on failure (for server pages)
 * @returns {Promise<User>}
 */
export async function requireDashboardUser({ redirect = false } = {}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    if (redirect) {
      const { redirect: nextRedirect } = await import("next/navigation");
      nextRedirect("/portal");
    }
    throw new Error("UNAUTHORIZED");
  }

  const sessionRow = await findSessionByTokenHash(hashToken(token));
  if (!sessionRow || !sessionRow.user) {
    if (redirect) {
      const { redirect: nextRedirect } = await import("next/navigation");
      nextRedirect("/portal");
    }
    throw new Error("UNAUTHORIZED");
  }

  const user = sessionRow.user;

  // Suspended users get bounced
  if (user.suspendedAt) {
    if (redirect) {
      const { redirect: nextRedirect } = await import("next/navigation");
      nextRedirect("/portal?reason=suspended");
    }
    throw new Error("SUSPENDED");
  }

  // Email must be verified to access dashboard
  if (!user.emailVerified) {
    if (redirect) {
      const { redirect: nextRedirect } = await import("next/navigation");
      nextRedirect("/portal/verify");
    }
    throw new Error("EMAIL_NOT_VERIFIED");
  }

  return user;
}

/**
 * Standardized error wrapper for dashboard API routes.
 * Catches UNAUTHORIZED/SUSPENDED errors and returns 401/403.
 */
export async function dashboardRoute(handler) {
  try {
    return await handler();
  } catch (err) {
    if (err.message === "UNAUTHORIZED" || err.message === "EMAIL_NOT_VERIFIED") {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }
    if (err.message === "SUSPENDED") {
      return NextResponse.json(
        { success: false, message: "Account suspended" },
        { status: 403 }
      );
    }
    console.error("[dashboardRoute] error:", err);
    return NextResponse.json(
      { success: false, message: "Internal error" },
      { status: 500 }
    );
  }
}

/**
 * Extract IP + UA from a request — used in audit logs.
 */
export function getRequestContext(request) {
  const ipAddress =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";
  return { ipAddress, userAgent };
}