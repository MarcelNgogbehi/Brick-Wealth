// app/api/admin/sales/[id]/route.js
//
// GET   /api/admin/sales/[id]  — full sale request context
// PATCH /api/admin/sales/[id]  — review: { action: "acknowledge"|"approve"|"decline", note?, declineReason? }
// POST  /api/admin/sales/[id]/settle is folded in here as POST with body.settle

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import {
  getSaleRequestForAdmin,
  reviewSaleRequest,
  settleSaleRequest,
} from "@/lib/db";
import {
  notifySaleRequestSettled,
  notifySaleRequestDeclined,
  notifySharesAcquired,
} from "@/lib/notify";
import { uploadServerFile } from "@/lib/server-upload";

// ────────────────────────────────────────────────────────────────────
// GET
// ────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  return adminRoute(async () => {
    await requireAdmin();
    const { id } = await params;
    const saleRequest = await getSaleRequestForAdmin(id);
    if (!saleRequest) {
      return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true, saleRequest });
  });
}

// ────────────────────────────────────────────────────────────────────
// PATCH — review actions
// ────────────────────────────────────────────────────────────────────
const PatchSchema = z.object({
  action: z.enum(["acknowledge", "approve", "decline"]),
  note: z.string().max(2000).optional(),
  declineReason: z.string().max(2000).optional(),
}).strict();

export async function PATCH(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }
    const admin = await requireAdmin();
    const { id } = await params;

    let raw;
    try { raw = await request.json(); }
    catch { return NextResponse.json({ success: false, message: "Invalid body" }, { status: 400 }); }

    const parsed = PatchSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const ctx = await getSaleRequestForAdmin(id);
    if (!ctx) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    try {
      const updated = await reviewSaleRequest({
        requestId: id,
        adminId: admin.id,
        action: parsed.data.action,
        note: parsed.data.note,
        declineReason: parsed.data.declineReason,
      });

      if (parsed.data.action === "decline" && ctx.investor?.id) {
        notifySaleRequestDeclined({
          userId: ctx.investor.id,
          spvName: ctx.spv?.spvName || "your SPV",
          requestId: id,
          reason: parsed.data.declineReason,
        });
      }

      await logAdminAction({
        adminId: admin.id,
        action: `sale_request.${parsed.data.action}`,
        entityType: "share_sale_request",
        entityId: id,
        metadata: { newStatus: updated.status },
        request,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        saleRequest: { id: updated.id, status: updated.status },
        message: `Request ${parsed.data.action === "decline" ? "declined" : parsed.data.action + "d"}`,
      });
    } catch (err) {
      return NextResponse.json({ success: false, message: err?.message || "Failed" }, { status: 400 });
    }
  });
}

// ────────────────────────────────────────────────────────────────────
// POST — settle (record the title transfer)
// ────────────────────────────────────────────────────────────────────
const SettleSchema = z.object({
  buyerType: z.enum(["company_buyback", "named_investor", "external"]),
  buyerUserId: z.string().optional(),
  buyerName: z.string().max(200).optional(),
  settledUnitPrice: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
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

    const parsed = SettleSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const ctx = await getSaleRequestForAdmin(id);
    if (!ctx) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 });

    try {
      const result = await settleSaleRequest({
        requestId: id,
        adminId: admin.id,
        buyerType: parsed.data.buyerType,
        buyerUserId: parsed.data.buyerUserId,
        buyerName: parsed.data.buyerName,
        settledUnitPrice: parsed.data.settledUnitPrice,
        notes: parsed.data.notes,
        uploadFn: uploadServerFile,
      });

      const spvName = ctx.spv?.spvName || "the SPV";
      const currencySymbol =
        ctx.currency === "USD" ? "$" : ctx.currency === "EUR" ? "€" : "£";

      // Seller notification
      if (ctx.investor?.id) {
        notifySaleRequestSettled({
          userId: ctx.investor.id,
          spvName,
          requestId: id,
          units: result.transfer.unitsTransferred,
          currencySymbol,
          amount: result.request.settledAmount,
        });
      }

      // Buyer notification (named investor only)
      if (parsed.data.buyerType === "named_investor" && parsed.data.buyerUserId) {
        notifySharesAcquired({
          userId: parsed.data.buyerUserId,
          spvName,
          units: result.transfer.unitsTransferred,
          certificateNumber: result.buyerCertificateNumber,
        });
      }

      await logAdminAction({
        adminId: admin.id,
        action: "sale_request.settled",
        entityType: "share_sale_request",
        entityId: id,
        metadata: {
          transferId: result.transfer.id,
          units: result.transfer.unitsTransferred,
          buyerType: parsed.data.buyerType,
          voidedCerts: result.transfer.voidedCertificateNumbers,
          newCert: result.transfer.newCertificateNumber,
        },
        request,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        transfer: result.transfer,
        message: `Transfer recorded — ${result.transfer.unitsTransferred} units`,
      });
    } catch (err) {
      return NextResponse.json({ success: false, message: err?.message || "Settlement failed" }, { status: 400 });
    }
  });
}