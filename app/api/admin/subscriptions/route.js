// app/api/admin/subscriptions/route.js
//
// GET /api/admin/subscriptions          — queue list with filters
// GET /api/admin/subscriptions?stats=1  — queue counts only
//
// Filters: status, oversized, spvId, search, sortBy, page, pageSize

import { NextResponse } from "next/server";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import {
  listSubscriptionsForAdmin,
  getSubscriptionAdminStats,
} from "@/lib/db";

export async function GET(request) {
  return adminRoute(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    // Stats-only mode
    if (searchParams.get("stats") === "1") {
      const stats = await getSubscriptionAdminStats();
      return NextResponse.json({ success: true, stats });
    }

    const status = searchParams.get("status") || undefined;
    const oversized = searchParams.get("oversized") === "1" ? true : undefined;
    const spvId = searchParams.get("spvId") || undefined;
    const search = searchParams.get("search") || undefined;
    const sortBy = searchParams.get("sortBy") || "newest";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "25", 10));

    const result = await listSubscriptionsForAdmin({
      status, oversized, spvId, search, sortBy, page, pageSize,
    });

    return NextResponse.json({ success: true, ...result });
  });
}