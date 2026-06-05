// app/api/dashboard/opportunities/[id]/route.js
//
// GET /api/dashboard/opportunities/[id]
// Single opportunity detail for investor.
//
// SECURITY:
// - Returns 404 if not "live" (no enumeration)
// - Returns 404 if investor type isn't eligible (no enumeration)
// - Records view in audit log (compliance)
// - Strips all admin-only and sensitive fields

import { NextResponse } from "next/server";
import {
  requireDashboardUser,
  dashboardRoute,
  getRequestContext,
} from "@/lib/dashboard-auth";
import {
  getOpportunityForInvestor,
  recordOpportunityView,
  getUserViewedDocumentIds,
  SUBSCRIPTION_ACTIVE_STATUSES,
} from "@/lib/db";
import { prisma } from "@/lib/prisma";

export async function GET(request, { params }) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const { id } = await params;

    const opportunity = await getOpportunityForInvestor({
      opportunityId: id,
      userId: user.id,
    });

    if (!opportunity) {
      // SECURITY: Return same 404 for "doesn't exist", "not live",
      // and "not eligible" — no enumeration.
      return NextResponse.json(
        { success: false, message: "Opportunity not found" },
        { status: 404 }
      );
    }

    // Fire-and-forget audit log (don't block on it)
    const { ipAddress, userAgent } = getRequestContext(request);
    recordOpportunityView({
      opportunityId: id,
      userId: user.id,
      ipAddress,
      userAgent,
    }).catch(() => {});

    // Get list of docs this user has already viewed (for UI badges)
    const [viewedDocumentIds, existingSubscription] = await Promise.all([
      getUserViewedDocumentIds(user.id, id),
      prisma.subscription.findFirst({
        where: {
          userId: user.id,
          opportunityId: id,
          status: { in: SUBSCRIPTION_ACTIVE_STATUSES },
        },
        select: { id: true, status: true },
      }),
    ]);

    return NextResponse.json({
      success: true,
      opportunity,
      viewedDocumentIds,
      userKycStatus: user.kycStatus || null,
      existingSubscription: existingSubscription || null,
    });
  });
}