// app/api/dashboard/opportunities/route.js
//
// GET /api/dashboard/opportunities
// Returns live opportunities visible to this investor.
//
// SECURITY:
// - Only status="live" returned
// - Filtered by user's investorType vs eligibleInvestorTypes
// - Admin-only fields stripped (createdById, suitabilityQuestions, banking)
// - Suspended users get empty results

import { NextResponse } from "next/server";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { listOpportunitiesForInvestor } from "@/lib/db";

export async function GET(request) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();

    const { searchParams } = new URL(request.url);

    const opts = {
      userId: user.id,
      search: searchParams.get("search") || undefined,
      sortBy: searchParams.get("sortBy") || "newest",
      page: parseInt(searchParams.get("page") || "1", 10),
      pageSize: Math.min(parseInt(searchParams.get("pageSize") || "20", 10), 50),
    };

    const result = await listOpportunitiesForInvestor(opts);
    return NextResponse.json({ success: true, ...result });
  });
}