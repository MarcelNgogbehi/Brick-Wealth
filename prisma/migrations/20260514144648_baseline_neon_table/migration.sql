-- Neon demo table created automatically by Neon on project setup.
-- This migration baselines it into Prisma's migration history without modifying it.
CREATE TABLE IF NOT EXISTS "playing_with_neon" (
    "id" SERIAL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "value" REAL
);
