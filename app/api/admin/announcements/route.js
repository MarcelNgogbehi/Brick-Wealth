// app/api/admin/announcements/route.js
//
// GET  /api/admin/announcements?status=...&page=1
// POST /api/admin/announcements    — create draft
//
// SECURITY: Admin session required.

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { logAdminAction, AUDIT_ACTIONS } from "@/lib/audit";
import {
  listAnnouncements,
  createAnnouncement,
} from "@/lib/db";

// ────────────────────────────────────────────────────────────────────
// GET — list
// ────────────────────────────────────────────────────────────────────
export async function GET(request) {
  return adminRoute(async () => {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "25", 10));

    const result = await listAnnouncements({ status, page, pageSize });
    return NextResponse.json({ success: true, ...result });
  });
}

// ────────────────────────────────────────────────────────────────────
// POST — create draft
// ────────────────────────────────────────────────────────────────────
const CreateSchema = z.object({
  title: z.string().min(2, "Title required").max(180),
  body: z.string().min(5, "Body too short").max(10_000),
  audience: z.string().min(1).max(100).default("all"),
  isPinned: z.boolean().default(false),
  expiresAt: z.string().datetime().nullable().optional(),
}).strict();

export async function POST(request) {
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

    const parsed = CreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Invalid input",
        },
        { status: 400 }
      );
    }

    // Validate audience format
    const aud = parsed.data.audience;
    const validAudience =
      aud === "all" || aud === "activated" || aud.startsWith("tag:");
    if (!validAudience) {
      return NextResponse.json(
        { success: false, message: "Invalid audience format (use 'all', 'activated', or 'tag:<name>')" },
        { status: 400 }
      );
    }

    try {
      const announcement = await createAnnouncement({
        ...parsed.data,
        createdById: admin.id,
      });

      await logAdminAction({
        adminId: admin.id,
        action: AUDIT_ACTIONS.ANNOUNCEMENT_CREATED || "announcement.created",
        entityType: "announcement",
        entityId: announcement.id,
        metadata: { title: announcement.title, audience: announcement.audience },
        request,
      }).catch(() => {});

      return NextResponse.json({ success: true, announcement });
    } catch (err) {
      console.error("[admin.announcements.create] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to create announcement" },
        { status: 500 }
      );
    }
  });
}