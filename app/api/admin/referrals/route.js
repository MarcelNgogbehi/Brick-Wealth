// app/api/admin/referrals/route.js
//
// GET /api/admin/referrals          — paginated list of all referral edges
// GET /api/admin/referrals?stats=1  — summary stats
// GET /api/admin/referrals?top=1    — top referrers leaderboard

import { NextResponse } from "next/server";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import {
  listReferralsForAdmin,
  getReferralAdminStats,
  getTopReferrers,
} from "@/lib/db";

export async function GET(request) {
  return adminRoute(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    if (searchParams.get("stats") === "1") {
      const stats = await getReferralAdminStats();
      return NextResponse.json({ success: true, stats });
    }

    if (searchParams.get("top") === "1") {
      const limit   = Math.min(20, parseInt(searchParams.get("limit") || "10", 10));
      const top     = await getTopReferrers({ limit });
      return NextResponse.json({ success: true, top });
    }

    const page     = Math.max(1, parseInt(searchParams.get("page")     || "1",  10));
    const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") || "25", 10));
    const status   = searchParams.get("status") || undefined;

    const result = await listReferralsForAdmin({ status, page, pageSize });
    return NextResponse.json({ success: true, ...result });
  });
}
