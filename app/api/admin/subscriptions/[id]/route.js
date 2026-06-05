// app/api/admin/subscriptions/[id]/route.js
//
// GET   /api/admin/subscriptions/[id]   — full context (investor + payment + allocations + history)
// PATCH /api/admin/subscriptions/[id]   — workflow action
//        Body: { action: "verify" | "fund" | "reject", notes?, reason? }
//
// PHASE 5 MSG 4 — added investor notification hooks on verify/fund/reject.

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import {
  getSubscriptionForAdmin,
  verifySubscription,
  fundSubscription,
  rejectSubscription,
} from "@/lib/db";
import {
  notifySubscriptionVerified,
  notifySubscriptionFunded,
  notifySubscriptionRejected,
} from "@/lib/notify";

// ────────────────────────────────────────────────────────────────────
// GET
// ────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  return adminRoute(async () => {
    await requireAdmin();
    const { id } = await params;

    const subscription = await getSubscriptionForAdmin(id);
    if (!subscription) {
      return NextResponse.json(
        { success: false, message: "Subscription not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, subscription });
  });
}

// ────────────────────────────────────────────────────────────────────
// PATCH — workflow transitions (with notification hooks)
// ────────────────────────────────────────────────────────────────────
const PatchSchema = z.object({
  action: z.enum(["verify", "fund", "reject"]),
  notes: z.string().max(2000).optional(),
  reason: z.string().max(2000).optional(),
}).strict();

export async function PATCH(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const admin = await requireAdmin();
    const { id } = await params;

    let raw;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid body" }, { status: 400 });
    }

    const parsed = PatchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { action, notes, reason } = parsed.data;

    try {
      // Load context (investor id + opportunity title) for notifications
      const ctx = await getSubscriptionForAdmin(id);
      if (!ctx) {
        return NextResponse.json({ success: false, message: "Subscription not found" }, { status: 404 });
      }
      const investorId = ctx.investor?.id;
      const opportunityTitle = ctx.opportunity?.title || "your investment";

      let updated;
      let auditAction;

      if (action === "verify") {
        updated = await verifySubscription({ subscriptionId: id, adminId: admin.id, notes });
        auditAction = "subscription.verified";
        if (investorId) {
          notifySubscriptionVerified({ userId: investorId, opportunityTitle, subscriptionId: id }).catch(() => {});
        }
      } else if (action === "fund") {
        updated = await fundSubscription({ subscriptionId: id, adminId: admin.id, notes });
        auditAction = "subscription.funded";
        if (investorId) {
          notifySubscriptionFunded({ userId: investorId, opportunityTitle, subscriptionId: id }).catch(() => {});
        }
      } else if (action === "reject") {
        updated = await rejectSubscription({ subscriptionId: id, adminId: admin.id, reason });
        auditAction = "subscription.rejected";
        if (investorId) {
          notifySubscriptionRejected({ userId: investorId, opportunityTitle, subscriptionId: id, reason }).catch(() => {});
        }
      }

      logAdminAction({
        adminId: admin.id,
        action: auditAction,
        entityType: "subscription",
        entityId: id,
        metadata: { newStatus: updated.status, notes: notes || reason || null },
        request,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        subscription: { id: updated.id, status: updated.status },
        message: `Subscription ${action === "reject" ? "rejected" : action + "ed"}`,
      });
    } catch (err) {
      console.error("[admin.subscription.patch]", action, err?.message, { id, adminId: admin.id });
      return NextResponse.json(
        { success: false, message: err?.message || "Action failed" },
        { status: 400 }
      );
    }
  });
}