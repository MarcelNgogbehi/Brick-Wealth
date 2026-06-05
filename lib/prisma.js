// lib/prisma.js
//
// Prisma client singleton.
// Without this, every Next.js hot-reload creates a new PrismaClient,
// which exhausts your DB connection pool. This caches one instance.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis;

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
