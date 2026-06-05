// lib/rate-limit.js
//
// Production rate limiter: Upstash Redis (REST) with in-memory fallback for dev.
//
// In production we use Upstash because:
//   - Survives server restarts
//   - Works across multiple Vercel/serverless instances
//   - Atomic INCR + EXPIRE = correct under concurrency
//   - REST API works in edge runtime
//
// Usage:
//   const rl = await rateLimit({ key: `login:${ip}`, limit: 20, windowMs: 60_000 });
//   if (!rl.ok) return errorResponse("Too many requests", 429);

import { env } from "@/lib/env";

// ─── In-memory fallback (dev only) ──────────────────────────────────
const memStore = new Map();

async function inMemoryLimit({ key, limit, windowMs }) {
  const now = Date.now();
  const entry = memStore.get(key);
  if (!entry || entry.resetAt < now) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, resetAt: now + windowMs };
  }
  if (entry.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }
  entry.count++;
  return { ok: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

// Periodic cleanup so memStore doesn't grow unbounded in long-running dev
if (typeof setInterval !== "undefined" && typeof process !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of memStore.entries()) {
      if (v.resetAt < now) memStore.delete(k);
    }
  }, 5 * 60_000).unref?.();
}

// ─── Redis (Upstash REST) limiter ────────────────────────────────────
async function upstashLimit({ key, limit, windowMs }) {
  const url = env.UPSTASH_REDIS_REST_URL;
  const token = env.UPSTASH_REDIS_REST_TOKEN;
  const namespace = `bw:rl:${key}`;

  // Single round-trip pipeline: INCR + EXPIRE (only if key just created)
  // EXPIRE is idempotent so re-setting it on each hit is safe but slightly wasteful.
  // Using NX flag would be ideal but Upstash REST doesn't support pipelined NX cleanly.
  const res = await fetch(`${url}/pipeline`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([
      ["INCR", namespace],
      ["PEXPIRE", namespace, String(windowMs), "NX"],
      ["PTTL", namespace],
    ]),
    cache: "no-store",
    signal: AbortSignal.timeout(3000), // 3 s — don't let a slow Redis block the request
  });

  if (!res.ok) {
    // Fail open in production — better than blocking legitimate users on Redis hiccup.
    // A real outage will be surfaced by monitoring on the 5xx rate of Upstash itself.
    console.error(`[rate-limit] Upstash error: ${res.status}`);
    return { ok: true, remaining: limit, degraded: true };
  }

  const data = await res.json();
  const count = data[0]?.result ?? 1;
  const ttlMs = data[2]?.result ?? windowMs;
  const remaining = Math.max(0, limit - count);

  if (count > limit) {
    return {
      ok: false,
      remaining: 0,
      retryAfter: Math.ceil(ttlMs / 1000),
    };
  }
  return { ok: true, remaining, resetAt: Date.now() + ttlMs };
}

// ─── PUBLIC API ──────────────────────────────────────────────────────
export async function rateLimit({ key, limit, windowMs }) {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      return await upstashLimit({ key, limit, windowMs });
    } catch (err) {
      // Network-level Upstash failure (timeout, DNS, connection reset).
      // Fail open so a Redis hiccup never blocks legitimate users or
      // causes API routes to return 500.
      console.error("[rate-limit] Upstash unreachable — failing open:", err?.message);
      return { ok: true, remaining: limit, degraded: true };
    }
  }
  return inMemoryLimit({ key, limit, windowMs });
}