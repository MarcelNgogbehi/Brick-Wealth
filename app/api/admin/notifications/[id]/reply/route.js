// app/api/admin/notifications/[id]/reply/route.js
//
// POST /api/admin/notifications/[id]/reply
// Body: { message }
//
// An admin replies to an investor's assistance request. This:
//   1. Creates a notification for the investor (their 5s-polling bell
//      surfaces it within seconds — a live update, no waiting).
//   2. Marks the admin's own copy of the request as read.
//   3. Marks every other admin's copy of the SAME request as read, so
//      the whole team sees it's been handled.
//   4. Writes an audit log entry.
//
// SECURITY: admin session + CSRF. The notification must belong to the
// replying admin and carry an investorId in its metadata.

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { createNotificationRow } from "@/lib/db";
import { prisma } from "@/lib/prisma";
import { logAdminAction, AUDIT_ACTIONS } from "@/lib/audit";

const Schema = z.object({
  message: z.string().trim().min(1, "Reply cannot be empty").max(4000),
}).strict();

export async function POST(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }

    const admin = await requireAdmin();
    const { id } = await params;

    let raw;
    try { raw = await request.json(); }
    catch { return NextResponse.json({ success: false, message: "Invalid body" }, { status: 400 }); }

    const parsed = Schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }
    const { message } = parsed.data;

    // The notification must belong to THIS admin (their inbox copy)
    const notif = await prisma.notification.findFirst({
      where: { id, userId: admin.id },
    });
    if (!notif) {
      return NextResponse.json({ success: false, message: "Message not found" }, { status: 404 });
    }

    const meta = notif.metadata || {};
    const investorId = meta.investorId;
    if (!investorId) {
      return NextResponse.json(
        { success: false, message: "This notification has no investor to reply to." },
        { status: 400 }
      );
    }

    // Confirm the investor still exists
    const investor = await prisma.user.findUnique({
      where: { id: investorId },
      select: { id: true, fullName: true, email: true },
    });
    if (!investor) {
      return NextResponse.json({ success: false, message: "Investor account no longer exists." }, { status: 404 });
    }

    const adminName = admin.fullName || "The Brick & Wealth team";
    const purpose = meta.purpose || "your message";

    // 1) LIVE notification to the investor — picked up by their bell poll
    await createNotificationRow({
      userId: investor.id,
      category: "support_reply",
      title: `Reply from Brick & Wealth — ${purpose}`,
      body: message,
      link: "/dashboard/notifications",
      metadata: {
        repliedBy: adminName,
        repliedById: admin.id,
        purpose,
        originalMessage: meta.message || null,
        requestSentAt: meta.sentAt || null,
        repliedAt: new Date().toISOString(),
      },
    });

    // 2 + 3) Mark this admin's copy read, and every other admin's copy of
    // the same request (matched by investor + original send time) read too.
    const now = new Date();
    await prisma.notification.update({
      where: { id: notif.id },
      data: { readAt: notif.readAt || now },
    }).catch(() => {});

    if (meta.sentAt) {
      await prisma.notification.updateMany({
        where: {
          category: "investor_assistance",
          readAt: null,
          AND: [
            { metadata: { path: ["investorId"], equals: investorId } },
            { metadata: { path: ["sentAt"], equals: meta.sentAt } },
          ],
        },
        data: { readAt: now },
      }).catch(() => {});
    }

    // 4) Audit trail
    await logAdminAction({
      adminId: admin.id,
      action: AUDIT_ACTIONS.INVESTOR_ASSISTANCE_REPLY || "investor.assistance_reply",
      entityType: "user",
      entityId: investor.id,
      metadata: {
        purpose,
        investorEmail: investor.email,
        replyLength: message.length,
      },
      request,
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: `Reply sent to ${investor.fullName || investor.email}.`,
    });
  });
}
