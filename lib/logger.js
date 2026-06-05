// lib/logger.js
//
// Structured logger.
// Emits JSON in production (one line per event, parseable by Datadog/Logtail).
// Pretty-prints in dev.
// Auto-redacts sensitive fields.

import { env } from "@/lib/env";

const SENSITIVE_KEYS = new Set([
  "password",
  "passwordHash",
  "token",
  "rawToken",
  "tokenHash",
  "sessionToken",
  "csrfToken",
  "authorization",
  "cookie",
]);

function redact(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(redact);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (SENSITIVE_KEYS.has(k)) {
      out[k] = "[REDACTED]";
    } else if (typeof v === "object") {
      out[k] = redact(v);
    } else {
      out[k] = v;
    }
  }
  return out;
}

function emit(level, event, meta = {}) {
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    event,
    ...redact(meta),
  };

  if (env.IS_PROD) {
    // JSON one-line format for log aggregators
    console.log(JSON.stringify(payload));
  } else {
    // Pretty-print in dev
    const color = { info: "\x1b[36m", warn: "\x1b[33m", error: "\x1b[31m", debug: "\x1b[90m" }[level] || "";
    const reset = "\x1b[0m";
    console.log(`${color}[${level}]${reset} ${event}`, Object.keys(meta).length ? redact(meta) : "");
  }
}

export const log = {
  info: (event, meta) => emit("info", event, meta),
  warn: (event, meta) => emit("warn", event, meta),
  error: (event, meta) => emit("error", event, meta),
  debug: (event, meta) => env.IS_DEV && emit("debug", event, meta),

  // Helper for API routes — logs request lifecycle
  apiStart(route, meta = {}) {
    emit("info", "api.start", { route, ...meta });
  },
  apiEnd(route, status, durationMs, meta = {}) {
    emit("info", "api.end", { route, status, durationMs, ...meta });
  },
  apiError(route, error, meta = {}) {
    emit("error", "api.error", {
      route,
      error: error?.message || String(error),
      stack: env.IS_DEV ? error?.stack : undefined,
      ...meta,
    });
  },

  // Audit log for sensitive actions
  audit(action, meta) {
    emit("info", "audit", { action, ...meta });
  },
};