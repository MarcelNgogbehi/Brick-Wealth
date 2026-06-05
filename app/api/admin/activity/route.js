// app/api/admin/activity/route.js
//
// GET /api/admin/activity?limit=&category=&search=
// Unified, chronological feed of investor-initiated activity across the
// platform (registrations, KYC, subscriptions, payments, share sales).

import { NextResponse } from "next/server";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { getInvestorActivityFeed } from "@/lib/db";
import { log } from "@/lib/logger";

const VALID_CATEGORIES = ["all", "registrations", "kyc", "subscriptions", "payments", "sales"];

export async function GET(request) {
  return adminRoute(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") || "40", 10) || 40));
    const categoryRaw = searchParams.get("category");
    const category = VALID_CATEGORIES.includes(categoryRaw) ? categoryRaw : null;
    const search = searchParams.get("search")?.trim() || null;

    try {
      const data = await getInvestorActivityFeed({ limit, category, search });
      return NextResponse.json({ success: true, ...data });
    } catch (err) {
      log.error("admin.activity.error", { error: err?.message });
      return NextResponse.json({ success: false, message: "Failed to load activity" }, { status: 500 });
    }
  });
}
