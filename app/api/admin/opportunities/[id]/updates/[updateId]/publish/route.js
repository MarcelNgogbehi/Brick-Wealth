// app/api/admin/opportunities/[id]/updates/[updateId]/publish/route.js
//
// POST /api/admin/opportunities/[id]/updates/[updateId]/publish
//
// Publishes a property update:
//   1. Resolves recipients via resolveUpdateRecipients (PHASE 5 swap point)
//   2. Sets publishedAt + notifiedCount
//   3. Fans out via notifyMany (NO recipients in Phase 4 Msg 3 = silent)
//   4. Audit logged
//
// PHASE 4 MSG 3: The notify hook is wired but resolveUpdateRecipients
// returns []. UI still shows "Published" successfully; no emails go out.
// PHASE 5: Swap resolveUpdateRecipients in lib/db.js — call sites unchanged.

import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import { notifyMany, NOTIFY } from "@/lib/notify";
import {
  getPropertyUpdateById,
  publishPropertyUpdate,
  resolveUpdateRecipients,
  getOpportunityById,
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
    const { id: opportunityId, updateId } = await params;

    const update = await getPropertyUpdateById(updateId);
    if (!update || update.opportunityId !== opportunityId) {
      return NextResponse.json(
        { success: false, message: "Update not found" },
        { status: 404 }
      );
    }
    if (update.deletedAt) {
      return NextResponse.json(
        { success: false, message: "Cannot publish deleted update" },
        { status: 400 }
      );
    }
    if (update.publishedAt) {
      return NextResponse.json(
        { success: false, message: "Already published" },
        { status: 400 }
      );
    }

    try {
      // 1. Resolve recipients (Phase 5 swap point in lib/db.js)
      const recipientUserIds = await resolveUpdateRecipients(opportunityId);

      // 2. Fan out notifications (best-effort; empty list = no-op)
      let fanOutResult = { inAppCount: 0, emailCount: 0 };
      if (recipientUserIds.length > 0) {
        const opp = await getOpportunityById(opportunityId);
        const oppTitle = opp?.title || "Your investment";
        const bodyPreview = update.body.length > 240
          ? update.body.slice(0, 240) + "..."
          : update.body;

        fanOutResult = await notifyMany({
          userIds: recipientUserIds,
          category: NOTIFY.PROPERTY_UPDATE,
          title: `${oppTitle}: ${update.title}`,
          body: bodyPreview,
          link: `/dashboard/opportunities/${opportunityId}?tab=updates&update=${update.id}`,
          metadata: {
            updateId: update.id,
            opportunityId,
            type: update.type,
          },
        });
      }

      // 3. Update record
      const published = await publishPropertyUpdate(updateId, recipientUserIds.length);

      // 4. Audit log
      await logAdminAction({
        adminId: admin.id,
        action: "property_update.published",
        entityType: "property_update",
        entityId: updateId,
        metadata: {
          opportunityId,
          title: update.title,
          type: update.type,
          recipientCount: recipientUserIds.length,
          inAppSent: fanOutResult.inAppCount,
          emailSent: fanOutResult.emailCount,
        },
        request,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        update: published,
        notified: {
          total: recipientUserIds.length,
          inApp: fanOutResult.inAppCount,
          email: fanOutResult.emailCount,
        },
        message: recipientUserIds.length === 0
          ? "Published (silent — subscriber notifications activate in Phase 5)"
          : `Published to ${recipientUserIds.length} subscriber${recipientUserIds.length === 1 ? "" : "s"}`,
      });
    } catch (err) {
      console.error("[admin.update.publish] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to publish" },
        { status: 500 }
      );
    }
  });
}