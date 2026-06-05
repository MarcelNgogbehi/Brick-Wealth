// app/api/dashboard/notifications/[id]/read/route.js
//
// POST /api/dashboard/notifications/[id]/read
//
// Marks a single notification as read.
// SECURITY: DB layer verifies the notification belongs to the user.

import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { markNotificationRead } from "@/lib/db";

export async function POST(request, { params }) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const user = await requireDashboardUser();
    const { id: notificationId } = await params;

    if (!notificationId || typeof notificationId !== "string") {
      return NextResponse.json(
        { success: false, message: "Invalid notification id" },
        { status: 400 }
      );
    }

    const ok = await markNotificationRead(notificationId, user.id);

    return NextResponse.json({
      success: ok,
      message: ok ? "Marked read" : "Notification not found or already read",
    });
  });
}