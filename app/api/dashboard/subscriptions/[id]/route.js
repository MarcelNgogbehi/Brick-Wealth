// app/api/dashboard/subscriptions/[id]/route.js
//
// GET   /api/dashboard/subscriptions/[id]      — view one (own only)
// PATCH /api/dashboard/subscriptions/[id]      — cancel (only pre-VERIFIED)
//
// SECURITY: ownership enforced in db layer (returns null if not owner).

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  getSubscriptionForInvestor,
  cancelSubscriptionByInvestor,
} from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";

// ────────────────────────────────────────────────────────────────────
// GET — one subscription
// ────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const { id } = await params;

    const subscription = await getSubscriptionForInvestor({
      subscriptionId: id,
      userId: user.id,
    });

    if (!subscription) {
      return NextResponse.json(
        { success: false, message: "Subscription not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      subscription,
      cardPaymentsEnabled: isStripeConfigured(),
    });
  });
}

// ────────────────────────────────────────────────────────────────────
// PATCH — cancel (the only investor-side mutation)
// Body: { action: "cancel" }
// ────────────────────────────────────────────────────────────────────

const PatchSchema = z.object({
  action: z.enum(["cancel"]),
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
    const { id } = await params;

    let raw;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid body" },
        { status: 400 }
      );
    }

    const parsed = PatchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid action" },
        { status: 400 }
      );
    }

    try {
      const updated = await cancelSubscriptionByInvestor({
        subscriptionId: id,
        userId: user.id,
      });

      return NextResponse.json({
        success: true,
        subscription: { id: updated.id, status: updated.status },
        message: "Subscription cancelled",
      });
    } catch (err) {
      const msg = err?.message || "Failed to cancel";
      return NextResponse.json(
        { success: false, message: msg },
        { status: 400 }
      );
    }
  });
}