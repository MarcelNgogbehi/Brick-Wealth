// app/api/dashboard/sessions/route.js
//
// GET    /api/dashboard/sessions — list active sessions
// DELETE /api/dashboard/sessions
//        Body: { sessionId: string }       — revoke specific session
//        OR
//        Body: { revokeAll: true }         — revoke all OTHER sessions
//
// SECURITY:
// - Auth required
// - DELETE requires CSRF
// - Can only revoke own sessions (server-side check in DB layer)
// - Never returns tokenHash

import { z } from "zod";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifyCsrf, hashToken } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  getActiveSessions,
  revokeSpecificSession,
  revokeAllOtherSessions,
} from "@/lib/db";

// ────────────────────────────────────────────────────────────────────
// GET
// ────────────────────────────────────────────────────────────────────
export async function GET() {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();

    const sessions = await getActiveSessions(user.id);

    // Identify current session by matching the cookie token
    const cookieStore = cookies();
    const currentToken = cookieStore.get("session_token")?.value;
    const currentTokenHash = currentToken ? hashToken(currentToken) : null;

    // Mark current session (we don't know token hash from list,
    // but we can match by id if we re-fetch). Simpler: fetch the
    // session id matching the current token.
    const { prisma } = await import("@/lib/prisma");
    let currentSessionId = null;
    if (currentTokenHash) {
      const current = await prisma.authToken.findFirst({
        where: { userId: user.id, tokenHash: currentTokenHash, type: "session" },
        select: { id: true },
      });
      currentSessionId = current?.id || null;
    }

    return NextResponse.json({
      success: true,
      sessions: sessions.map((s) => ({
        ...s,
        isCurrent: s.id === currentSessionId,
      })),
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// DELETE
// ────────────────────────────────────────────────────────────────────
const DeleteSchema = z.union([
  z.object({ sessionId: z.string().min(1) }).strict(),
  z.object({ revokeAll: z.literal(true) }).strict(),
]);

export async function DELETE(request) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const user = await requireDashboardUser();

    let raw;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid body" },
        { status: 400 }
      );
    }

    const parsed = DeleteSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input" },
        { status: 400 }
      );
    }

    try {
      if ("revokeAll" in parsed.data && parsed.data.revokeAll) {
        // Revoke all OTHER sessions, keep current one
        const cookieStore = cookies();
        const currentToken = cookieStore.get("session_token")?.value;
        const keepTokenHash = currentToken ? hashToken(currentToken) : "";
        const result = await revokeAllOtherSessions(user.id, keepTokenHash);
        return NextResponse.json({
          success: true,
          revokedCount: result.count,
          message: `Signed out of ${result.count} other device${result.count === 1 ? "" : "s"}`,
        });
      } else {
        // Revoke specific session
        const ok = await revokeSpecificSession(user.id, parsed.data.sessionId);
        if (!ok) {
          return NextResponse.json(
            { success: false, message: "Session not found" },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          message: "Session revoked",
        });
      }
    } catch (err) {
      console.error("[sessions.delete] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to revoke session" },
        { status: 500 }
      );
    }
  });
}