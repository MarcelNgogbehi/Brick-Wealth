// app/api/admin/announcements/[id]/route.js
//
// GET    /api/admin/announcements/[id]        — get single
// PATCH  /api/admin/announcements/[id]        — update
// DELETE /api/admin/announcements/[id]        — delete

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { logAdminAction, AUDIT_ACTIONS } from "@/lib/audit";
import {
  getAnnouncementById,
  updateAnnouncement,
  deleteAnnouncement,
} from "@/lib/db";

// ────────────────────────────────────────────────────────────────────
// GET
// ────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  return adminRoute(async () => {
    await requireAdmin();

    const { id } = await params;
    const announcement = await getAnnouncementById(id);
    if (!announcement) {
      return NextResponse.json(
        { success: false, message: "Not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, announcement });
  });
}

// ────────────────────────────────────────────────────────────────────
// PATCH
// ────────────────────────────────────────────────────────────────────
const UpdateSchema = z.object({
  title: z.string().min(2).max(180).optional(),
  body: z.string().min(5).max(10_000).optional(),
  audience: z.string().min(1).max(100).optional(),
  isPinned: z.boolean().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
}).strict();

export async function PATCH(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const admin = await requireAdmin();

    let raw;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid body" },
        { status: 400 }
      );
    }

    const parsed = UpdateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    if (parsed.data.audience) {
      const aud = parsed.data.audience;
      const valid = aud === "all" || aud === "activated" || aud.startsWith("tag:");
      if (!valid) {
        return NextResponse.json(
          { success: false, message: "Invalid audience format" },
          { status: 400 }
        );
      }
    }

    const { id } = await params;

    try {
      const announcement = await updateAnnouncement(id, parsed.data);

      await logAdminAction({
        adminId: admin.id,
        action: AUDIT_ACTIONS.ANNOUNCEMENT_UPDATED || "announcement.updated",
        entityType: "announcement",
        entityId: announcement.id,
        metadata: { changes: Object.keys(parsed.data) },
        request,
      }).catch(() => {});

      return NextResponse.json({ success: true, announcement });
    } catch (err) {
      console.error("[admin.announcement.update] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to update" },
        { status: 500 }
      );
    }
  });
}

// ────────────────────────────────────────────────────────────────────
// DELETE
// ────────────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const admin = await requireAdmin();

    const { id } = await params;

    try {
      await deleteAnnouncement(id);

      await logAdminAction({
        adminId: admin.id,
        action: AUDIT_ACTIONS.ANNOUNCEMENT_DELETED || "announcement.deleted",
        entityType: "announcement",
        entityId: id,
        request,
      }).catch(() => {});

      return NextResponse.json({ success: true, message: "Deleted" });
    } catch (err) {
      console.error("[admin.announcement.delete] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to delete" },
        { status: 500 }
      );
    }
  });
}