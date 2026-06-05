// app/api/admin/sales/route.js
//
// GET /api/admin/sales            — sale request queue with filters
// GET /api/admin/sales?stats=1    — queue counts
// GET /api/admin/sales?buyers=1&spvId=...&excludeUserId=...&search=... — buyer candidates

import { NextResponse } from "next/server";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import {
  listSaleRequestsForAdmin,
  getSaleRequestAdminStats,
  listBuyerCandidates,
} from "@/lib/db";

export async function GET(request) {
  return adminRoute(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    if (searchParams.get("stats") === "1") {
      const stats = await getSaleRequestAdminStats();
      return NextResponse.json({ success: true, stats });
    }

    if (searchParams.get("buyers") === "1") {
      const buyers = await listBuyerCandidates({
        spvId: searchParams.get("spvId") || undefined,
        excludeUserId: searchParams.get("excludeUserId") || undefined,
        search: searchParams.get("search") || undefined,
      });
      return NextResponse.json({ success: true, buyers });
    }

    const result = await listSaleRequestsForAdmin({
      status: searchParams.get("status") || undefined,
      spvId: searchParams.get("spvId") || undefined,
      search: searchParams.get("search") || undefined,
      page: parseInt(searchParams.get("page") || "1", 10),
      pageSize: Math.min(100, parseInt(searchParams.get("pageSize") || "25", 10)),
    });
    return NextResponse.json({ success: true, ...result });
  });
}