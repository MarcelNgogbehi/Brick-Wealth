// app/api/dashboard/notifications/[id]/route.js
//
// DELETE /api/dashboard/notifications/[id] — permanently delete one notification

import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { deleteNotification } from "@/lib/db";

export async function DELETE(request, { params }) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }

    const user = await requireDashboardUser();
    const { id } = await params;

    const deleted = await deleteNotification(id, user.id);
    if (!deleted) {
      return NextResponse.json({ success: false, message: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Notification deleted" });
  });
}
