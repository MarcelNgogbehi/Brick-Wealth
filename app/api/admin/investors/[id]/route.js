// app/api/admin/investors/[id]/route.js
//
// GET    /api/admin/investors/[id] — Full investor profile
// PATCH  /api/admin/investors/[id] — Update limited fields (suspend/unsuspend)
// DELETE /api/admin/investors/[id] — Permanently delete an investor account (super admin only)

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, requireSuperAdmin, adminRoute } from "@/lib/admin-auth";
import {
  getInvestorById,
  suspendInvestor,
  unsuspendInvestor,
  getNotesForInvestor,
  getReferralContextForUser,
  getInvestorFinancialFootprint,
  deleteUser,
} from "@/lib/db";
import { logAdminAction, AUDIT_ACTIONS } from "@/lib/audit";

export async function GET(request, { params }) {
  return adminRoute(async () => {
    await requireAdmin();
    const { id } = await params;

    const [investor, notes, referralContext, financialFootprint] = await Promise.all([
      getInvestorById(id),
      getNotesForInvestor(id),
      getReferralContextForUser(id).catch(() => null),
      getInvestorFinancialFootprint(id).catch(() => null),
    ]);

    if (!investor) {
      return errorResponse("Investor not found", 404);
    }

    return successResponse({
      investor: {
        ...investor,
        passwordHash: undefined, // never leak the hash
      },
      notes,
      referralContext,
      financialFootprint,
    });
  });
}

const PatchSchema = z.object({
  action: z.enum(["suspend", "unsuspend"]),
  reason: z.string().max(500).optional(),
}).strict();

export async function PATCH(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return errorResponse("Invalid request", 403);
    }

    const admin = await requireAdmin();
    const { id } = await params;

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = PatchSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse("Invalid action", 400);
    }
    const { action, reason } = parsed.data;

    const before = await getInvestorById(id);
    if (!before) return errorResponse("Investor not found", 404);

    let after;
    let auditAction;

    if (action === "suspend") {
      if (!reason) return errorResponse("Reason is required to suspend", 400);
      after = await suspendInvestor(id, reason);
      auditAction = AUDIT_ACTIONS.INVESTOR_SUSPENDED;
    } else {
      after = await unsuspendInvestor(id);
      auditAction = AUDIT_ACTIONS.INVESTOR_UNSUSPENDED;
    }

    await logAdminAction({
      adminId: admin.id,
      action: auditAction,
      entityType: "user",
      entityId: id,
      before: { suspendedAt: before.suspendedAt, suspensionReason: before.suspensionReason },
      after: { suspendedAt: after.suspendedAt, suspensionReason: after.suspensionReason },
      metadata: { reason },
      request,
    });

    return successResponse({
      message: action === "suspend" ? "Investor suspended" : "Suspension lifted",
      investor: { ...after, passwordHash: undefined },
    });
  });
}

export async function DELETE(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return errorResponse("Invalid request", 403);
    }

    // Permanently deleting an account is irreversible — super admin only.
    const superAdmin = await requireSuperAdmin();
    const { id } = await params;

    const target = await getInvestorById(id);
    if (!target) return errorResponse("Investor not found", 404);

    // Guard rails: never let an admin delete themselves or another admin
    // through this endpoint (use the role tools first to demote).
    if (target.id === superAdmin.id) {
      return errorResponse("You cannot delete your own account", 400);
    }
    if (target.role === "admin" || target.role === "super_admin") {
      return errorResponse(
        "Cannot delete an admin account. Demote the user to investor first.",
        400
      );
    }

    // Block deletion while the investor is mid-investment — deleting them
    // would orphan live subscriptions / allocations / holdings / sale requests.
    const footprint = await getInvestorFinancialFootprint(id);
    if (footprint.hasActivePositions) {
      return errorResponse(
        "Cannot delete — this investor has active financial records. Cancel or settle their subscriptions, allocations, holdings and sale requests first.",
        409
      );
    }

    await deleteUser(id);

    await logAdminAction({
      adminId: superAdmin.id,
      action: AUDIT_ACTIONS.INVESTOR_DELETED,
      entityType: "user",
      entityId: id,
      before: {
        email: target.email,
        fullName: target.fullName,
        username: target.username,
        kycStatus: target.kycStatus,
        accountActivated: target.accountActivated,
      },
      after: null,
      metadata: {
        targetEmail: target.email,
        targetName: target.fullName,
      },
      request,
    });

    return successResponse({
      message: "Investor account permanently deleted",
      deletedId: id,
    });
  });
}