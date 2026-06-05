// app/api/dashboard/announcements/route.js
//
// GET /api/dashboard/announcements?page=1
//
// Returns published announcements visible to this investor based on
// audience matching (all / activated / tag-based).

import { NextResponse } from "next/server";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  listAnnouncementsForInvestor,
  getMostRecentUnreadAnnouncement,
} from "@/lib/db";

export async function GET(request) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") || "20", 10));
    const wantBanner = searchParams.get("banner") === "true";

    if (wantBanner) {
      // Return only the most-recent unread for the home page banner
      const recent = await getMostRecentUnreadAnnouncement(user.id);
      return NextResponse.json({ success: true, announcement: recent });
    }

    const result = await listAnnouncementsForInvestor({
      userId: user.id,
      page,
      pageSize,
    });

    return NextResponse.json({ success: true, ...result });
  });
}