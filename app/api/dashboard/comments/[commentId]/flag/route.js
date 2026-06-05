// app/api/dashboard/comments/[commentId]/flag/route.js
//
// POST /api/dashboard/comments/[commentId]/flag
// Body: { reason? }
//
// Investor flags a comment for admin review.

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { flagComment } from "@/lib/db";

const Schema = z.object({
  reason: z.string().trim().max(500).optional(),
}).strict().partial();

export async function POST(request, { params }) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const user = await requireDashboardUser();
    const { commentId } = await params;

    let reason;
    try {
      const raw = await request.json().catch(() => ({}));
      const parsed = Schema.safeParse(raw || {});
      if (parsed.success) reason = parsed.data.reason;
    } catch {}

    try {
      const result = await flagComment({
        commentId,
        reporterId: user.id,
        reason,
      });

      if (result?.alreadyFlagged) {
        return NextResponse.json({
          success: true,
          alreadyFlagged: true,
          message: "Already reported",
        });
      }

      return NextResponse.json({
        success: true,
        flagCount: result.flagCount,
        message: "Thanks for flagging. Our team will review it.",
      });
    } catch (err) {
      console.error("[comments.flag] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to flag comment" },
        { status: 500 }
      );
    }
  });
}