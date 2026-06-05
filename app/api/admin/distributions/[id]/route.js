// app/api/admin/distributions/[id]/route.js
//
// GET    /api/admin/distributions/[id]   — full distribution + allocations
// PATCH  /api/admin/distributions/[id]   — edit a DRAFT
// POST   /api/admin/distributions/[id]   — { action: "record" } run attribution + notify
// DELETE /api/admin/distributions/[id]   — cancel (DRAFT deletes; RECORDED soft-cancels)

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import {
  getDistributionForAdmin,
  updateDistributionDraft,
  recordDistribution,
  cancelDistribution,
} from "@/lib/db";
import {
  notifyDistributionRecorded,
  notifyAdminOfDistribution,
} from "@/lib/notify";

const CURRENCY_SYMBOLS = { GBP: "£", USD: "$", EUR: "€" };

// ─── GET ─────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  return adminRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const distribution = await getDistributionForAdmin(id);
    if (!distribution) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, distribution });
  });
}

// ─── PATCH: edit draft ───────────────────────────────────────────────
const PatchSchema = z.object({
  declarationLabel: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).optional(),
  totalAmount: z.union([z.number(), z.string()]).optional(),
  recordDate: z.string().optional(),
  paymentDate: z.string().optional(),
  withholdingPct: z.number().min(0).max(100).nullable().optional(),
  withholdingNote: z.string().max(2000).optional(),
  bankReference: z.string().max(200).optional(),
}).strict();

export async function PATCH(request, { params }) {
  return adminRoute(async () => {
    const admin = await requireAdmin();
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }
    const { id } = await params;

    let body;
    try { body = await request.json(); } catch {
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
    }
    const parsed = PatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Validation failed", errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    try {
      const updated = await updateDistributionDraft(id, parsed.data);
      await logAdminAction({
        adminId: admin.id,
        action: "distribution.draft_updated",
        entityType: "Distribution",
        entityId: id,
        after: { totalAmount: updated.totalAmount?.toString() },
        request,
      });
      return NextResponse.json({ success: true, distribution: { ...updated, totalAmount: updated.totalAmount?.toString(), amountPerUnit: updated.amountPerUnit?.toString() } });
    } catch (err) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  });
}

// ─── POST: record (attribution engine + notify fan-out) ──────────────
const PostSchema = z.object({
  action: z.literal("record"),
}).strict();

export async function POST(request, { params }) {
  return adminRoute(async () => {
    const admin = await requireAdmin();
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }
    const { id } = await params;

    let body;
    try { body = await request.json(); } catch {
      return NextResponse.json({ success: false, message: "Invalid request body" }, { status: 400 });
    }
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Unknown action" }, { status: 400 });
    }

    try {
      // Run the attribution engine — snapshots holders, creates allocations
      const { distribution, allocationCount } = await recordDistribution({
        distributionId: id,
        adminId: admin.id,
      });

      // Load the recorded distribution + allocations to notify each holder
      const full = await getDistributionForAdmin(id);
      const symbol = CURRENCY_SYMBOLS[full?.currency] || "£";
      const spvName = full?.spv?.spvName || "your investment";

      // Fan-out — one per holder (each carries their own gross amount)
      if (full?.allocations?.length) {
        await Promise.allSettled(
          full.allocations.map((a) =>
            notifyDistributionRecorded({
              userId: a.userId,
              spvName,
              distributionLabel: full.declarationLabel,
              currencySymbol: symbol,
              grossAmount: a.grossAmount,
              paymentDate: full.paymentDate,
            })
          )
        );
      }

      // Admin confirmation
      await notifyAdminOfDistribution({
        spvName,
        distributionLabel: full.declarationLabel,
        holdersAtRecord: distribution.holdersAtRecord,
        currencySymbol: symbol,
        totalAmount: distribution.totalAmount?.toString(),
        distributionId: id,
      });

      await logAdminAction({
        adminId: admin.id,
        action: "distribution.recorded",
        entityType: "Distribution",
        entityId: id,
        after: {
          status: "RECORDED",
          holdersAtRecord: distribution.holdersAtRecord,
          totalUnitsAtRecord: distribution.totalUnitsAtRecord,
          amountPerUnit: distribution.amountPerUnit?.toString(),
        },
        request,
      });

      return NextResponse.json({
        success: true,
        message: `Recorded and attributed to ${allocationCount} holder${allocationCount === 1 ? "" : "s"}.`,
        allocationCount,
      });
    } catch (err) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  });
}

// ─── DELETE: cancel ──────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  return adminRoute(async () => {
    const admin = await requireAdmin();
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }
    const { id } = await params;

    let reason;
    try {
      const body = await request.json().catch(() => ({}));
      reason = typeof body?.reason === "string" ? body.reason.trim() : undefined;
    } catch { reason = undefined; }

    try {
      await cancelDistribution({ distributionId: id, adminId: admin.id, reason });
      await logAdminAction({
        adminId: admin.id,
        action: "distribution.cancelled",
        entityType: "Distribution",
        entityId: id,
        after: { reason: reason || null },
        request,
      });
      return NextResponse.json({ success: true, message: "Distribution cancelled." });
    } catch (err) {
      return NextResponse.json({ success: false, message: err.message }, { status: 400 });
    }
  });
}