// app/api/dashboard/announcements/[id]/read/route.js
//
// POST /api/dashboard/announcements/[id]/read
//
// Marks an announcement as read/dismissed for the current investor.

import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { markAnnouncementRead } from "@/lib/db";

export async function POST(request, { params }) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const user = await requireDashboardUser();
    const { id: announcementId } = await params;

    if (!announcementId || typeof announcementId !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid announcement id" },
        { status: 400 }
      );
    }

    const ok = await markAnnouncementRead(announcementId, user.id);

    return NextResponse.json({
      success: ok,
      message: ok ? "Marked read" : "Could not mark read",
    });
  });
}
