// app/api/admin/opportunities/[id]/updates/[updateId]/route.js
//
// PATCH  /api/admin/opportunities/[id]/updates/[updateId]   — edit
// DELETE /api/admin/opportunities/[id]/updates/[updateId]   — soft delete

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import {
  getPropertyUpdateById,
  updatePropertyUpdate,
  softDeletePropertyUpdate,
  UPDATE_TYPES,
} from "@/lib/db";

const VALID_TYPES = UPDATE_TYPES.map((t) => t.value);

const UpdateSchema = z.object({
  type: z.enum(VALID_TYPES).optional(),
  title: z.string().min(2).max(180).optional(),
  body: z.string().min(5).max(10_000).optional(),
  images: z.array(z.string().url()).max(6).optional(),
  isPinned: z.boolean().optional(),
  metadata: z.record(z.unknown()).optional().nullable(),
}).strict();

// ────────────────────────────────────────────────────────────────────
// PATCH
// ────────────────────────────────────────────────────────────────────
export async function PATCH(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const admin = await requireAdmin();
    const { id: opportunityId, updateId } = await params;

    const existing = await getPropertyUpdateById(updateId);
    if (!existing || existing.opportunityId !== opportunityId) {
      return NextResponse.json(
        { success: false, message: "Update not found" },
        { status: 404 }
      );
    }
    if (existing.deletedAt) {
      return NextResponse.json(
        { success: false, message: "Cannot edit deleted update" },
        { status: 400 }
      );
    }

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

    try {
      const updated = await updatePropertyUpdate(updateId, parsed.data);

      await logAdminAction({
        adminId: admin.id,
        action: "property_update.updated",
        entityType: "property_update",
        entityId: updateId,
        metadata: {
          opportunityId,
          changes: Object.keys(parsed.data),
        },
        request,
      }).catch(() => {});

      return NextResponse.json({ success: true, update: updated });
    } catch (err) {
      console.error("[admin.update.patch] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to update" },
        { status: 500 }
      );
    }
  });
}

// ────────────────────────────────────────────────────────────────────
// DELETE — soft delete
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
    const { id: opportunityId, updateId } = await params;

    const existing = await getPropertyUpdateById(updateId);
    if (!existing || existing.opportunityId !== opportunityId) {
      return NextResponse.json(
        { success: false, message: "Update not found" },
        { status: 404 }
      );
    }

    try {
      await softDeletePropertyUpdate(updateId);

      await logAdminAction({
        adminId: admin.id,
        action: "property_update.deleted",
        entityType: "property_update",
        entityId: updateId,
        metadata: {
          opportunityId,
          title: existing.title,
          wasPublished: !!existing.publishedAt,
        },
        request,
      }).catch(() => {});

      return NextResponse.json({ success: true, message: "Update deleted" });
    } catch (err) {
      console.error("[admin.update.delete] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to delete" },
        { status: 500 }
      );
    }
  });
}