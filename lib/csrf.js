// lib/csrf.js
//
// CSRF primitives for middleware (Edge Runtime safe).
// Uses the double-submit cookie pattern: a random token is set as a cookie
// and the client must echo it back in the X-CSRF-Token request header.
// Cross-site requests cannot read same-site cookies, so an attacker cannot
// forge the header value — no HMAC needed.
//
// ⚠️  Uses ONLY Web Crypto API (globalThis.crypto) — no Node.js imports.
//     This file is imported by middleware.js which runs in the Edge Runtime.

export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

// ─── EDGE-SAFE CONSTANT-TIME COMPARISON ──────────────────────────────────────
// XOR every character code; short-circuit only on length mismatch (not content).
function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

// ─── TOKEN GENERATION (Edge Runtime compatible) ───────────────────────────────
// 32 random bytes → 64-char lowercase hex string.
// Uses the Web Crypto API which is available in both Edge and Node.js runtimes.
export function generateCsrfToken() {
  const bytes = new Uint8Array(32);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── VERIFICATION ─────────────────────────────────────────────────────────────
// Called by API route handlers (Node.js) and can also be called from middleware.
// Uses only primitives available in both runtimes.
export function verifyCsrf(request) {
  const headerToken = request.headers.get("x-csrf-token");

  // NextRequest exposes .cookies; raw Request objects don't — fall back to the
  // raw Cookie header so this works in both middleware and API routes.
  let cookieToken = request.cookies?.get?.("csrf_token")?.value;
  if (!cookieToken) {
    const cookieHeader = request.headers.get("cookie") || "";
    const m = cookieHeader.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    if (m) cookieToken = decodeURIComponent(m[1]);
  }

  if (!headerToken || !cookieToken) return false;
  return safeCompare(headerToken, cookieToken);
}

// ─── COOKIE OPTIONS ───────────────────────────────────────────────────────────
export function csrfCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: false, // must be readable by JS so the client can set X-CSRF-Token
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}
