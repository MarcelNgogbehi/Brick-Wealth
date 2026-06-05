// app/api/dashboard/kyc/route.js
// GET /api/dashboard/kyc — returns investor's own KYC documents

import { NextResponse } from "next/server";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { getUserKycDocuments } from "@/lib/db";

export async function GET() {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const documents = await getUserKycDocuments(user.id);
    return NextResponse.json({ success: true, documents });
  });
}
