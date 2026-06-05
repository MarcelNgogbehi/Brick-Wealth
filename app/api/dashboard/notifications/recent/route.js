// app/api/dashboard/notifications/recent/route.js
//
// GET /api/dashboard/notifications/recent
//
// Lightweight endpoint for the topbar bell dropdown.
// Returns last 10 notifications + unread count.
// Polled every 30s by the topbar component.

import { NextResponse } from "next/server";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  getRecentNotifications,
  getUnreadNotificationCount,
} from "@/lib/db";

export async function GET() {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();

    const [recent, unreadCount] = await Promise.all([
      getRecentNotifications(user.id, 10),
      getUnreadNotificationCount(user.id),
    ]);

    return NextResponse.json({
      success: true,
      recent,
      unreadCount,
    });
  });
}