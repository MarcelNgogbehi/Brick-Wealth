// app/api/admin/distributions/route.js
//
// GET  /api/admin/distributions          — paginated list of distributions
// GET  /api/admin/distributions?stats=1  — summary stats for the header cards
// POST /api/admin/distributions          — create a new DRAFT distribution

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import {
  listDistributionsForAdmin,
  getDistributionAdminStats,
  createDistributionDraft,
} from "@/lib/db";

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request) {
  return adminRoute(async () => {
    await requireAdmin();
    const { searchParams } = new URL(request.url);

    if (searchParams.get("stats") === "1") {
      const stats = await getDistributionAdminStats();
      return NextResponse.json({ success: true, stats });
    }

    const page     = Math.max(1, parseInt(searchParams.get("page")  || "1", 10));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("pageSize") || "25", 10)));
    const status   = searchParams.get("status")  || undefined;
    const spvId    = searchParams.get("spvId")   || undefined;
    const sortBy   = searchParams.get("sortBy")  || "newest";

    const result = await listDistributionsForAdmin({ page, pageSize, status, spvId, sortBy });
    return NextResponse.json({ success: true, ...result });
  });
}

// ─── POST: create draft ───────────────────────────────────────────────────────
const CreateSchema = z.object({
  spvId:            z.string().min(1),
  declarationLabel: z.string().min(1).max(200),
  description:      z.string().max(4000).optional(),
  totalAmount:      z.union([z.number().positive(), z.string().regex(/^\d+(\.\d+)?$/)]),
  recordDate:       z.string().min(1),
  paymentDate:      z.string().min(1),
  withholdingPct:   z.number().min(0).max(100).nullable().optional(),
  withholdingNote:  z.string().max(2000).optional(),
  bankReference:    z.string().max(200).optional(),
}).strict();

export async function POST(request) {
  return adminRoute(async () => {
    const admin = await requireAdmin();

    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
    }

    const parsed = CreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: z.flattenError(parsed.error).fieldErrors },
        { status: 400 }
      );
    }

    try {
      const distribution = await createDistributionDraft({
        ...parsed.data,
        recordedByAdminId: admin.id,
      });

      await logAdminAction({
        adminId: admin.id,
        action: "distribution.draft_created",
        entityType: "Distribution",
        entityId: distribution.id,
        after: {
          spvId: distribution.spvId,
          declarationLabel: distribution.declarationLabel,
          totalAmount: distribution.totalAmount?.toString(),
          status: "DRAFT",
        },
        request,
      });

      return NextResponse.json(
        {
          success: true,
          message: "Distribution draft created.",
          distribution: {
            ...distribution,
            totalAmount:   distribution.totalAmount?.toString(),
            amountPerUnit: distribution.amountPerUnit?.toString(),
          },
        },
        { status: 201 }
      );
    } catch (err) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  });
}
