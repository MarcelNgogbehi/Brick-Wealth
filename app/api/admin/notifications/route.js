// app/api/admin/notifications/route.js
//
// GET   /api/admin/notifications        → recent notifications + unread count
// PATCH /api/admin/notifications        → mark one ({ id }) or all ({ markAllRead:true }) read
//
// Admin notifications are ordinary Notification rows addressed to the
// admin's own user id (e.g. created by the investor assistance flow).
// Polled by the admin topbar bell so investor messages "drop in" live.

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import {
  getRecentNotifications,
  getUnreadNotificationCount,
  markNotificationRead,
  markAllNotificationsRead,
  listNotifications,
} from "@/lib/db";

export async function GET(request) {
  return adminRoute(async () => {
    const admin = await requireAdmin();

    // Full inbox view for the /admin/notifications dashboard.
    // ?view=list&filter=all|unread|assistance&page=N
    const { searchParams } = new URL(request.url);
    if (searchParams.get("view") === "list") {
      const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);
      const filter = searchParams.get("filter") || "all";
      const result = await listNotifications({
        userId: admin.id,
        category: filter === "assistance" ? "investor_assistance" : undefined,
        onlyUnread: filter === "unread",
        page,
        pageSize: 20,
      });
      return NextResponse.json({ success: true, ...result });
    }

    // Default: lightweight feed for the topbar bell.
    const [recent, unreadCount] = await Promise.all([
      getRecentNotifications(admin.id, 15),
      getUnreadNotificationCount(admin.id),
    ]);
    return NextResponse.json({ success: true, recent, unreadCount });
  });
}

const PatchSchema = z.union([
  z.object({ markAllRead: z.literal(true) }).strict(),
  z.object({ id: z.string().min(1) }).strict(),
]);

export async function PATCH(request) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }
    const admin = await requireAdmin();

    let raw;
    try { raw = await request.json(); }
    catch { return NextResponse.json({ success: false, message: "Invalid body" }, { status: 400 }); }

    const parsed = PatchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Invalid input" }, { status: 400 });
    }

    if ("markAllRead" in parsed.data) {
      const count = await markAllNotificationsRead(admin.id);
      return NextResponse.json({ success: true, count });
    }

    await markNotificationRead(parsed.data.id, admin.id);
    return NextResponse.json({ success: true });
  });
}
