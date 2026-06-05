// app/api/dashboard/me/route.js
//
// GET /api/dashboard/me
// Returns investor's account state for the smart home page.

import { NextResponse } from "next/server";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { getInvestorDashboardSummary } from "@/lib/db";

export async function GET() {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const summary = await getInvestorDashboardSummary(user.id);
    if (!summary) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, ...summary });
  });
}