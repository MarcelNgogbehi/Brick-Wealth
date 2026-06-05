// proxy.js
//
// Next.js 16 "proxy" convention (formerly `middleware.js`).
// Runs before every request (Edge Runtime).
// - Mints CSRF tokens (double-submit cookie pattern)
// - Sets security headers on every response
//
// Must live at the project root (alongside package.json), not inside app/.

import { NextResponse } from "next/server";
import { generateCsrfToken, csrfCookieOptions } from "@/lib/csrf";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];
const LOGIN_URL = "/portal";

export function proxy(request) {
  const { pathname } = request.nextUrl;

  // ─── AUTH GUARD ────────────────────────────────────────────────────
  // Redirect unauthenticated users away from protected routes.
  // Full session validation happens in each route's server layout;
  // this check is a fast first gate based on cookie presence.
  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(prefix + "/")
  );

  if (isProtected) {
    const hasDashboardSession = !!request.cookies.get("session_token");
    const hasAdminSession = !!request.cookies.get("admin_session");

    const needsDashboardAuth = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
    const needsAdminAuth = pathname === "/admin" || pathname.startsWith("/admin/");

    const isAuthed =
      (needsDashboardAuth && hasDashboardSession) ||
      (needsAdminAuth && (hasAdminSession || hasDashboardSession));

    if (!isAuthed) {
      const loginUrl = new URL(LOGIN_URL, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const response = NextResponse.next();

  // ─── CSRF TOKEN BOOTSTRAP ──────────────────────────────────────────
  // Set a fresh token only when the browser doesn't already have one.
  // The token is a 64-char hex string; JS reads it from the cookie and
  // echoes it back in every mutating request as X-CSRF-Token.
  if (!request.cookies.get("csrf_token")) {
    const token = generateCsrfToken();
    const opts = csrfCookieOptions();
    response.cookies.set("csrf_token", token, {
      httpOnly: opts.httpOnly,
      secure: opts.secure,
      sameSite: opts.sameSite,
      path: opts.path,
      maxAge: opts.maxAge,
    });
  }

  // ─── SECURITY HEADERS ──────────────────────────────────────────────
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );

  // Content Security Policy
  const cspDirectives = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://challenges.cloudflare.com https://uploadthing.com https://*.uploadthing.com https://*.ingest.uploadthing.com" +
      (process.env.SENTRY_DSN ? " https://*.sentry.io" : ""),
    "frame-src https://challenges.cloudflare.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ];
  response.headers.set("Content-Security-Policy", cspDirectives.join("; "));

  if (process.env.NODE_ENV === "production") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Skip static assets — run on everything else
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
