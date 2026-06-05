// app/api/dashboard/opportunities/[id]/updates/route.js
//
// GET /api/dashboard/opportunities/[id]/updates?page=1
//
// Returns published, non-deleted updates with reactions & comment counts.
// SECURITY: Verifies the user can see this opportunity via the existing
// getOpportunityForInvestor (which enforces live status + eligibility + KYC).

import { NextResponse } from "next/server";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  getOpportunityForInvestor,
  listPropertyUpdatesForInvestor,
} from "@/lib/db";

export async function GET(request, { params }) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const { id: opportunityId } = await params;

    // Verify the user can see this opportunity
    const opp = await getOpportunityForInvestor({
      opportunityId,
      userId: user.id,
    });
    if (!opp) {
      return NextResponse.json(
        { success: false, message: "Opportunity not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") || "20", 10));

    const result = await listPropertyUpdatesForInvestor({
      opportunityId,
      userId: user.id,
      page,
      pageSize,
    });

    return NextResponse.json({ success: true, ...result });
  });
}