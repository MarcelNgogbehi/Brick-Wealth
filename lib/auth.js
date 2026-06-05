// lib/auth.js
//
// Security primitives. All API routes import from here.

import crypto from "crypto";
import bcrypt from "bcrypt";
import { env } from "@/lib/env";

// ─── CONSTANTS ────────────────────────────────────────────────────────
export const TOKEN_TTL_MS = 4 * 60 * 60 * 1000;          // 4 hours
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;  // 30 days
export const BCRYPT_ROUNDS = 12;
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;          // 15 minutes

// ─── REQUEST ID (for tracing) ─────────────────────────────────────────
export function generateRequestId() {
  return crypto.randomBytes(8).toString("hex");
}   

// ─── TOKEN GENERATION ─────────────────────────────────────────────────
export function generateToken() {
  return crypto.randomBytes(32).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// ─── PASSWORD HASHING ─────────────────────────────────────────────────
export async function hashPassword(password) {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash);
}

// ─── CSRF ─────────────────────────────────────────────────────────
// Double-submit cookie pattern: the X-CSRF-Token header must exactly match
// the csrf_token cookie. Cross-site requests cannot read cookies from a
// different origin, so an attacker cannot forge the header value.
// NOTE: Must use same format as /lib/csrf.js (hex, not base64url)

export function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

export function verifyCsrf(request) {
  const headerToken = request.headers.get("x-csrf-token");

  // Try request.cookies (NextRequest) then fall back to raw Cookie header
  // in case the request object doesn't carry a parsed .cookies property.
  let cookieToken = request.cookies?.get?.("csrf_token")?.value;
  if (!cookieToken) {
    const cookieHeader = request.headers.get("cookie") || "";
    const m = cookieHeader.match(/(?:^|;\s*)csrf_token=([^;]+)/);
    if (m) cookieToken = decodeURIComponent(m[1]);
  }

  if (!headerToken || !cookieToken) {
    console.error("[CSRF] Missing token", { hasHeader: !!headerToken, hasCookie: !!cookieToken });
    return false;
  }

  if (!safeCompare(headerToken, cookieToken)) {
    console.error("[CSRF] Token mismatch");
    return false;
  }

  return true;
}

// ─── INPUT VALIDATION ────────────────────────────────────────────────
export function isValidEmail(email) {
  return typeof email === "string" && email.length <= 254 &&
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
}

export function isValidUsername(username) {
  return typeof username === "string" && /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export function isValidName(name) {
  return typeof name === "string" && /^[a-zA-ZÀ-ÿ\s'-]{2,60}$/.test(name.trim());
}

export function isValidCountryCode(code) {
  return typeof code === "string" && /^[A-Z]{2}$/.test(code);
}

export function sanitizeString(s, maxLen = 200) {
  if (typeof s !== "string") return "";
  // eslint-disable-next-line no-control-regex
  return s.trim().replace(/[\x00-\x1F\x7F]/g, "").slice(0, maxLen);
}

// ─── REQUEST METADATA ─────────────────────────────────────────────────
export function getClientIp(request) {
  return (
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-real-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export function getUserAgent(request) {
  return request.headers.get("user-agent")?.slice(0, 500) || "unknown";
}

// ─── COOKIE HELPERS ───────────────────────────────────────────────────
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: env.IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

export function csrfCookieOptions() {
  return {
    httpOnly: false, // JS reads it for X-CSRF-Token header
    secure: env.IS_PROD,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_MS / 1000,
  };
}

// Build a Set-Cookie header value
export function buildCookieHeader(name, value, opts) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${opts.path || "/"}`,
    `Max-Age=${opts.maxAge}`,
    `SameSite=${opts.sameSite || "Lax"}`,
  ];
  if (opts.httpOnly) parts.push("HttpOnly");
  if (opts.secure) parts.push("Secure");
  return parts.join("; ");
}

// ─── CAPTCHA (Cloudflare Turnstile, optional) ────────────────────────
export async function verifyTurnstile(token, ip) {
  if (!env.TURNSTILE_SECRET_KEY) {
    // CAPTCHA not configured — skip in dev / pre-launch
    return { ok: true, skipped: true };
  }
  if (!token) return { ok: false, reason: "missing-token" };

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: ip,
      }),
    });
    const data = await res.json();
    return { ok: !!data.success, errors: data["error-codes"] };
  } catch {
    return { ok: false, reason: "turnstile-error" };
  }
}

// ─── RESPONSE HELPERS ─────────────────────────────────────────────────
export function errorResponse(message, status = 400, fieldErrors = null, headers = {}) {
  const body = { error: true, message };
  if (fieldErrors) body.fieldErrors = fieldErrors;
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...headers,
    },
  });
}

export function successResponse(data = {}, init = {}) {
  return new Response(JSON.stringify({ error: false, ...data }), {
    status: 200,
    ...init,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...(init.headers || {}),
    },
  });
}