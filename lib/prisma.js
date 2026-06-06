// lib/prisma.js
//
// Prisma client singleton.
// Without this, every Next.js hot-reload creates a new PrismaClient,
// which exhausts your DB connection pool. This caches one instance.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

// ─── CONNECTION POOL SIZING ────────────────────────────────────────────
// Prisma's default pool is `num_cpus * 2 + 1` (9 on a 4-core box). Some admin
// endpoints fan out well past that in a single request — the dashboard's
// /api/admin/stats fires ~16 queries at once (getAdminDashboardStats +
// getAdminDashboardInsights). With only 9 connections the surplus queries wait
// on the pool and, when the DB is slow or cold (Neon autosuspend), blow the 10s
// pool timeout: "Timed out fetching a new connection from the connection pool."
// The heavier insights queries lose that race first, so live stats silently
// came back null and auth lookups intermittently 401'd.
//
// We give the pool comfortable headroom above the worst-case fan-out and a
// longer pool_timeout to ride out a cold-start spike. This is safe here because
// the runtime URL is Neon's pooled (pgbouncer) endpoint, which multiplexes
// these client connections server-side. Any value already present in the URL
// wins, so deployments can still override per-environment.
function tunePoolUrl(rawUrl) {
  if (!rawUrl) return undefined;
  try {
    const url = new URL(rawUrl);
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "21");
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "20");
    }
    return url.toString();
  } catch {
    // Not a parseable URL (e.g. prisma+postgres:// dev proxy) — leave it alone.
    return rawUrl;
  }
}

const datasourceUrl = tunePoolUrl(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    ...(datasourceUrl ? { datasourceUrl } : {}),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
