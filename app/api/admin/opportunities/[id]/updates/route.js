// app/api/admin/opportunities/[id]/updates/route.js
//
// GET  /api/admin/opportunities/[id]/updates
//      ?includeDeleted=true&page=1
// POST /api/admin/opportunities/[id]/updates    — create draft
//
// SECURITY: Admin session required, CSRF on POST.

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import {
  listPropertyUpdatesForAdmin,
  createPropertyUpdate,
  getOpportunityById,
  UPDATE_TYPES,
} from "@/lib/db";

// ────────────────────────────────────────────────────────────────────
// GET — list
// ────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  return adminRoute(async () => {
    await requireAdmin();
    const { id: opportunityId } = await params;

    const opp = await getOpportunityById(opportunityId);
    if (!opp) {
      return NextResponse.json(
        { success: false, message: "Opportunity not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const includeDeleted = searchParams.get("includeDeleted") === "true";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(100, parseInt(searchParams.get("pageSize") || "50", 10));

    const result = await listPropertyUpdatesForAdmin({
      opportunityId,
      includeDeleted,
      page,
      pageSize,
    });

    return NextResponse.json({ success: true, ...result });
  });
}

// ────────────────────────────────────────────────────────────────────
// POST — create draft
// ────────────────────────────────────────────────────────────────────
const VALID_TYPES = UPDATE_TYPES.map((t) => t.value);

const CreateSchema = z.object({
  type: z.enum(VALID_TYPES).default("general"),
  title: z.string().min(2, "Title required").max(180),
  body: z.string().min(5, "Body too short").max(10_000),
  images: z.array(z.string().url()).max(6, "Maximum 6 images").default([]),
  isPinned: z.boolean().default(false),
  metadata: z.record(z.unknown()).optional(),
}).strict();

export async function POST(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const admin = await requireAdmin();
    const { id: opportunityId } = await params;

    const opp = await getOpportunityById(opportunityId);
    if (!opp) {
      return NextResponse.json(
        { success: false, message: "Opportunity not found" },
        { status: 404 }
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

    const parsed = CreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    try {
      const update = await createPropertyUpdate({
        opportunityId,
        ...parsed.data,
        createdById: admin.id,
      });

      await logAdminAction({
        adminId: admin.id,
        action: "property_update.created",
        entityType: "property_update",
        entityId: update.id,
        metadata: {
          opportunityId,
          type: update.type,
          title: update.title,
        },
        request,
      }).catch(() => {});

      return NextResponse.json({ success: true, update });
    } catch (err) {
      console.error("[admin.update.create] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to create update" },
        { status: 500 }
      );
    }
  });
}