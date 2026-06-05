// app/api/dashboard/announcements/[id]/route.js
//
// GET /api/dashboard/announcements/[id]
// Returns a single published announcement for the authenticated investor
// and marks it as read automatically.

import { NextResponse } from "next/server";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { getAnnouncementById, markAnnouncementRead } from "@/lib/db";

export async function GET(_request, { params }) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const { id } = await params;

    const announcement = await getAnnouncementById(id);

    if (!announcement || !announcement.publishedAt) {
      return NextResponse.json(
        { success: false, message: "Announcement not found" },
        { status: 404 }
      );
    }

    // Auto-mark as read when the investor opens it
    await markAnnouncementRead(id, user.id);

    return NextResponse.json({ success: true, announcement });
  });
}
