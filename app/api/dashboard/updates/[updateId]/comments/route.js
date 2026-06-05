// app/api/dashboard/updates/[updateId]/comments/route.js
//
// GET  /api/dashboard/updates/[updateId]/comments?page=1
// POST /api/dashboard/updates/[updateId]/comments
//      Body: { body, parentCommentId? }
//
// SECURITY: Verifies the update is visible (published + visible parent
// opportunity). Rate-limited at 5/min/user.

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  getPropertyUpdateById,
  getOpportunityForInvestor,
  listCommentsForUpdate,
  createComment,
  checkCommentRateLimit,
  findUserById,
} from "@/lib/db";

// ────────────────────────────────────────────────────────────────────
// GET — list comments
// ────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const { updateId } = await params;

    const update = await getPropertyUpdateById(updateId);
    if (!update || update.deletedAt || !update.publishedAt) {
      return NextResponse.json(
        { success: false, message: "Update not found" },
        { status: 404 }
      );
    }

    const opp = await getOpportunityForInvestor({
      opportunityId: update.opportunityId,
      userId: user.id,
    });
    if (!opp) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "50", 10));

    const result = await listCommentsForUpdate({
      updateId,
      page,
      pageSize,
    });

    return NextResponse.json({ success: true, ...result });
  });
}

// ────────────────────────────────────────────────────────────────────
// POST — create comment
// ────────────────────────────────────────────────────────────────────
const CreateSchema = z.object({
  body: z.string().trim().min(1, "Comment cannot be empty").max(1000, "Comment too long"),
  parentCommentId: z.string().cuid().nullable().optional(),
}).strict();

export async function POST(request, { params }) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const user = await requireDashboardUser();
    const { updateId } = await params;

    // Suspended users cannot comment
    const fullUser = await findUserById(user.id);
    if (!fullUser || fullUser.suspendedAt) {
      return NextResponse.json(
        { success: false, message: "Your account is suspended. Contact support." },
        { status: 403 }
      );
    }

    const update = await getPropertyUpdateById(updateId);
    if (!update || update.deletedAt || !update.publishedAt) {
      return NextResponse.json(
        { success: false, message: "Update not found" },
        { status: 404 }
      );
    }

    const opp = await getOpportunityForInvestor({
      opportunityId: update.opportunityId,
      userId: user.id,
    });
    if (!opp) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

    // Rate limit: 5/min/user
    const rl = checkCommentRateLimit(user.id);
    if (!rl.allowed) {
      const retrySec = Math.ceil(rl.retryAfterMs / 1000);
      return NextResponse.json(
        {
          success: false,
          message: `Slow down — try again in ${retrySec}s`,
          retryAfterMs: rl.retryAfterMs,
        },
        { status: 429 }
      );
    }

    let raw;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid body" },
        { status: 400 }
      );
    }

    const parsed = CreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    try {
      const comment = await createComment({
        updateId,
        userId: user.id,
        body: parsed.data.body,
        parentCommentId: parsed.data.parentCommentId || null,
      });

      // Return hydrated shape for optimistic UI
      return NextResponse.json({
        success: true,
        comment: {
          id: comment.id,
          updateId: comment.updateId,
          userId: comment.userId,
          authorName: fullUser.fullName,
          authorIsAdmin: false,
          body: comment.body,
          parentCommentId: comment.parentCommentId,
          isPinnedByAdmin: false,
          isFlagged: false,
          isDeleted: false,
          editedAt: null,
          createdAt: comment.createdAt,
          replies: [],
        },
      });
    } catch (err) {
      const msg = err?.message || "Failed to post comment";
      console.error("[comments.create] error:", msg);
      return NextResponse.json(
        { success: false, message: msg },
        { status: 400 }
      );
    }
  });
}