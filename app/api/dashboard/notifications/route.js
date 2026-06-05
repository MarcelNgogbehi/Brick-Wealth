// app/api/dashboard/notifications/route.js
//
// GET  /api/dashboard/notifications
//      ?page=1&pageSize=20&category=...&onlyUnread=true
// POST /api/dashboard/notifications
//      Body: { markAllRead: true }

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  listNotifications,
  markAllNotificationsRead,
  deleteAllNotificationsForUser,
} from "@/lib/db";

export async function GET(request) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") || "20", 10));
    const category = searchParams.get("category") || undefined;
    const onlyUnread = searchParams.get("onlyUnread") === "true";

    const result = await listNotifications({
      userId: user.id,
      category,
      onlyUnread,
      page,
      pageSize,
    });

    return NextResponse.json({ success: true, ...result });
  });
}

const PostSchema = z.object({
  markAllRead: z.literal(true),
}).strict();

export async function POST(request) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const user = await requireDashboardUser();

    let raw;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid body" },
        { status: 400 }
      );
    }

    const parsed = PostSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input" },
        { status: 400 }
      );
    }

    if (parsed.data.markAllRead) {
      const count = await markAllNotificationsRead(user.id);
      return NextResponse.json({
        success: true,
        markedRead: count,
        message: count > 0 ? `Marked ${count} notification${count === 1 ? "" : "s"} read` : "Nothing to mark read",
      });
    }

    return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
  });
}

export async function DELETE(request) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }
    const user = await requireDashboardUser();
    const count = await deleteAllNotificationsForUser(user.id);
    return NextResponse.json({
      success: true,
      deleted: count,
      message: count > 0 ? `Deleted ${count} notification${count === 1 ? "" : "s"}` : "No notifications to delete",
    });
  });
}