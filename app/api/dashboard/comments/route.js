// app/api/dashboard/comments/[commentId]/route.js
//
// PATCH  /api/dashboard/comments/[commentId]      — edit (owner, 5-min window)
// DELETE /api/dashboard/comments/[commentId]      — soft delete (owner or admin)

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { logAdminAction } from "@/lib/audit";
import {
  editComment,
  softDeleteComment,
  findUserById,
} from "@/lib/db";

// ────────────────────────────────────────────────────────────────────
// PATCH — edit comment
// ────────────────────────────────────────────────────────────────────
const EditSchema = z.object({
  body: z.string().trim().min(1).max(1000),
}).strict();

export async function PATCH(request, { params }) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const user = await requireDashboardUser();
    const { commentId } = await params;

    let raw;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid body" },
        { status: 400 }
      );
    }

    const parsed = EditSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    try {
      const updated = await editComment({
        commentId,
        userId: user.id,
        body: parsed.data.body,
      });
      return NextResponse.json({
        success: true,
        comment: {
          id: updated.id,
          body: updated.body,
          editedAt: updated.editedAt,
        },
      });
    } catch (err) {
      const msg = err?.message || "Failed to edit comment";
      return NextResponse.json(
        { success: false, message: msg },
        { status: 400 }
      );
    }
  });
}

// ────────────────────────────────────────────────────────────────────
// DELETE — soft delete (owner or admin)
// ────────────────────────────────────────────────────────────────────
const DeleteSchema = z.object({
  reason: z.string().max(500).optional(),
}).strict().partial();

export async function DELETE(request, { params }) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const user = await requireDashboardUser();
    const { commentId } = await params;

    // Determine if admin via role lookup
    const fullUser = await findUserById(user.id);
    const isAdmin = fullUser?.role === "admin" || fullUser?.role === "super_admin";

    let reason;
    try {
      const raw = await request.json().catch(() => ({}));
      const parsed = DeleteSchema.safeParse(raw || {});
      if (parsed.success) reason = parsed.data.reason;
    } catch {}

    try {
      await softDeleteComment({
        commentId,
        requestingUserId: user.id,
        isAdmin,
        reason,
      });

      // Audit if admin deleted someone else's comment
      if (isAdmin) {
        await logAdminAction({
          adminId: user.id,
          action: "comment.deleted_by_admin",
          entityType: "update_comment",
          entityId: commentId,
          metadata: { reason: reason || null },
          request,
        }).catch(() => {});
      }

      return NextResponse.json({ success: true, message: "Comment deleted" });
    } catch (err) {
      const msg = err?.message || "Failed to delete comment";
      return NextResponse.json(
        { success: false, message: msg },
        { status: 400 }
      );
    }
  });
}