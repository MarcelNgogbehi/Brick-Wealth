// app/api/admin/announcements/[id]/publish/route.js
//
// POST /api/admin/announcements/[id]/publish
//
// Publishes a draft announcement:
//   1. Resolves audience to user IDs
//   2. Fans out via notifyMany (in-app + email per user preferences)
//   3. Updates announcement with publishedAt + notifiedCount
//   4. Audit-logged
//
// SECURITY: Admin session required, CSRF, ownership not required
//          (any admin can publish any draft).

import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { logAdminAction, AUDIT_ACTIONS } from "@/lib/audit";
import { notifyMany, NOTIFY } from "@/lib/notify";
import {
  getAnnouncementById,
  publishAnnouncement,
  resolveAnnouncementAudience,
} from "@/lib/db";

export async function POST(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const admin = await requireAdmin();

    const { id } = await params;
    const announcement = await getAnnouncementById(id);
    if (!announcement) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }
    if (announcement.publishedAt) {
      return NextResponse.json(
        { success: false, message: "Already published" },
        { status: 400 }
      );
    }

    try {
      // 1. Resolve audience
      const users = await resolveAnnouncementAudience(announcement.audience);

      if (users.length === 0) {
        return NextResponse.json(
          {
            success: false,
            message: "Audience resolved to 0 users — nothing to publish",
          },
          { status: 400 }
        );
      }

      // 2. Fan out (best-effort — partial failures don't stop publishing)
      const fanOutResult = await notifyMany({
        userIds: users.map((u) => u.id),
        category: NOTIFY.ADMIN_ANNOUNCEMENT,
        title: announcement.title,
        body: announcement.body.length > 280
          ? announcement.body.slice(0, 280) + "..."
          : announcement.body,
        link: `/dashboard/announcements/${announcement.id}`,
        metadata: { announcementId: announcement.id },
      });

      // 3. Update announcement
      const updated = await publishAnnouncement(announcement.id, users.length);

      // 4. Audit log
      await logAdminAction({
        adminId: admin.id,
        action: AUDIT_ACTIONS.ANNOUNCEMENT_PUBLISHED || "announcement.published",
        entityType: "announcement",
        entityId: announcement.id,
        metadata: {
          audience: announcement.audience,
          recipientCount: users.length,
          inAppSent: fanOutResult.inAppCount,
          emailSent: fanOutResult.emailCount,
        },
        request,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        announcement: updated,
        notified: {
          total: users.length,
          inApp: fanOutResult.inAppCount,
          email: fanOutResult.emailCount,
        },
        message: `Published to ${users.length} investor${users.length === 1 ? "" : "s"}`,
      });
    } catch (err) {
      console.error("[admin.announcement.publish] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to publish" },
        { status: 500 }
      );
    }
  });
}