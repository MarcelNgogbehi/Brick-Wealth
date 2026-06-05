// app/api/admin/investors/[id]/flag/route.js
//
// POST /api/admin/investors/[id]/flag
// Body: { action: "flag" | "unflag", reason?: string }

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { flagInvestor, unflagInvestor, findUserById } from "@/lib/db";
import { logAdminAction, AUDIT_ACTIONS } from "@/lib/audit";

const FlagSchema = z.object({
  action: z.enum(["flag", "unflag"]),
  reason: z.string().max(500).optional(),
}).strict();

export async function POST(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return errorResponse("Invalid request", 403);
    }

    const admin = await requireAdmin();
    const { id: userId } = await params;

    const before = await findUserById(userId);
    if (!before) return errorResponse("Investor not found", 404);

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = FlagSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse("Invalid action", 400);
    }
    const { action, reason } = parsed.data;

    let after;
    let auditAction;

    if (action === "flag") {
      if (!reason) {
        return errorResponse("Reason is required when flagging", 400, {
          reason: "Please provide a reason",
        });
      }
      after = await flagInvestor(userId, reason);
      auditAction = AUDIT_ACTIONS.INVESTOR_FLAGGED;
    } else {
      after = await unflagInvestor(userId);
      auditAction = AUDIT_ACTIONS.INVESTOR_UNFLAGGED;
    }

    await logAdminAction({
      adminId: admin.id,
      action: auditAction,
      entityType: "user",
      entityId: userId,
      before: {
        flaggedForReview: before.flaggedForReview,
        flagReason: before.flagReason,
      },
      after: {
        flaggedForReview: after.flaggedForReview,
        flagReason: after.flagReason,
      },
      metadata: { reason },
      request,
    });

    return successResponse({
      message: action === "flag" ? "Investor flagged" : "Flag removed",
      flaggedForReview: after.flaggedForReview,
      flagReason: after.flagReason,
    });
  });
}