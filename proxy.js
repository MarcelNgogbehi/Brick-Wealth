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

  // ─── LEGACY ADMIN COOKIE HEALING ───────────────────────────────────
  // The admin_session cookie used to be scoped to `Path=/admin`. Such a cookie
  // is sent to /admin/* pages (so the server layout renders the console) but is
  // NOT sent to /api/admin/* route handlers — "/api/admin/…" is not a subpath of
  // "/admin" — so every admin data fetch (investors, live stats, …) came back
  // 401 and the UI showed "Couldn't load…". The cookie is now minted at `Path=/`
  // (lib/auth.adminSessionCookieOptions), but admins who signed in before that
  // change are stranded until their session expires. On any admin page
  // navigation the legacy cookie IS present here, so re-anchor it at `Path=/`
  // (and clear the stale /admin-scoped copy) before the page's own fetches run.
  // The DB token (AuthToken.expiresAt) stays the source of truth for validity,
  // so refreshing Max-Age here cannot extend a session past its real expiry.
  //
  // These run last, as raw header appends: the CSRF bootstrap above goes through
  // response.cookies.set(), which re-serializes the Set-Cookie header from its
  // own store — appending before it would silently drop these. Two distinct
  // Set-Cookie values (same name, different paths) are also why we can't use the
  // cookies API, which is keyed by name only.
  const onAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");
  const adminSession = request.cookies.get("admin_session")?.value;
  if (onAdminPage && adminSession) {
    const secure = process.env.NODE_ENV === "production";
    const flags = `SameSite=Lax; HttpOnly${secure ? "; Secure" : ""}`;
    response.headers.append(
      "Set-Cookie",
      `admin_session=${encodeURIComponent(adminSession)}; Path=/; Max-Age=${4 * 60 * 60}; ${flags}`
    );
    response.headers.append(
      "Set-Cookie",
      `admin_session=; Path=/admin; Max-Age=0; ${flags}`
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
