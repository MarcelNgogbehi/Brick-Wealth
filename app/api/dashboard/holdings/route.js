// app/api/dashboard/holdings/route.js
//
// GET /api/dashboard/holdings — list the investor's holdings
//
// Returns enriched holdings (SPV + property + opportunity context).

import { NextResponse } from "next/server";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { listHoldingsForInvestor } from "@/lib/db";

export async function GET() {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const holdings = await listHoldingsForInvestor(user.id);
    return NextResponse.json({ success: true, holdings });
  });
}