// app/api/admin/spvs/[id]/mortgage/route.js
//
// GET    /api/admin/spvs/[id]/mortgage — get mortgage (if any)
// PUT    /api/admin/spvs/[id]/mortgage — create or update mortgage (upsert)
// DELETE /api/admin/spvs/[id]/mortgage — remove mortgage

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import {
  getMortgageBySpvId,
  upsertMortgage,
  deleteMortgage,
  getSpvById,
} from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { log } from "@/lib/logger";

function serializeMortgage(m) {
  if (!m) return null;
  return {
    ...m,
    principalAmount: m.principalAmount?.toString(),
    monthlyPaymentEst: m.monthlyPaymentEst?.toString() || null,
  };
}

// ────────────────────────────────────────────────────────────────────
// GET
// ────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  return adminRoute(async () => {
    await requireAdmin();
    const { id: spvId } = await params;

    const spv = await getSpvById(spvId);
    if (!spv) return errorResponse("SPV not found", 404);

    const mortgage = await getMortgageBySpvId(spvId);
    return successResponse({ mortgage: serializeMortgage(mortgage) });
  });
}

// ────────────────────────────────────────────────────────────────────
// PUT — upsert
// ────────────────────────────────────────────────────────────────────
const MortgageSchema = z.object({
  lenderName: z.string().min(2, "Lender name required").max(200),
  mortgageType: z.enum(["spv_btl", "commercial", "bridging", "development"]),
  currency: z.enum(["GBP", "USD", "EUR"]).optional(),
  principalAmount: z.number().min(1).max(1_000_000_000),
  ltvPct: z.number().min(0).max(100),
  interestRate: z.number().min(0).max(30),
  termMonths: z.number().int().min(1).max(600),
  monthlyPaymentEst: z.number().min(0).max(10_000_000).optional().nullable(),
  startDate: z.string().min(1, "Start date required"),
  endDate: z.string().optional().or(z.literal("")).nullable(),
  covenantsNotes: z.string().max(2000).optional().or(z.literal("")).nullable(),
}).strict();

export async function PUT(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

    const admin = await requireAdmin();
    const { id: spvId } = await params;

    const spv = await getSpvById(spvId);
    if (!spv) return errorResponse("SPV not found", 404);

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    // Empty strings → null
    const cleaned = {};
    for (const [k, v] of Object.entries(raw)) {
      cleaned[k] = v === "" ? null : v;
    }

    const parsed = MortgageSchema.safeParse(cleaned);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message || "Invalid input",
        400,
        Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message]))
      );
    }

    const before = await getMortgageBySpvId(spvId);

    try {
      const mortgage = await upsertMortgage(spvId, parsed.data);

      await logAdminAction({
        adminId: admin.id,
        action: before ? "mortgage.updated" : "mortgage.created",
        entityType: "spv",
        entityId: spvId,
        before: before
          ? {
              lenderName: before.lenderName,
              principalAmount: before.principalAmount?.toString(),
              ltvPct: before.ltvPct,
            }
          : null,
        after: {
          lenderName: mortgage.lenderName,
          principalAmount: mortgage.principalAmount?.toString(),
          ltvPct: mortgage.ltvPct,
        },
        request,
      });

      return successResponse({ mortgage: serializeMortgage(mortgage) });
    } catch (err) {
      log.error("mortgage.upsert.error", { error: err?.message });
      return errorResponse("Failed to save mortgage", 500);
    }
  });
}

// ────────────────────────────────────────────────────────────────────
// DELETE
// ────────────────────────────────────────────────────────────────────
export async function DELETE(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

    const admin = await requireAdmin();
    const { id: spvId } = await params;

    const existing = await getMortgageBySpvId(spvId);
    if (!existing) return errorResponse("No mortgage to delete", 404);

    try {
      await deleteMortgage(spvId);

      await logAdminAction({
        adminId: admin.id,
        action: "mortgage.deleted",
        entityType: "spv",
        entityId: spvId,
        before: {
          lenderName: existing.lenderName,
          principalAmount: existing.principalAmount?.toString(),
        },
        request,
      });

      return successResponse({ message: "Mortgage deleted" });
    } catch (err) {
      log.error("mortgage.delete.error", { error: err?.message });
      return errorResponse("Failed to delete mortgage", 500);
    }
  });
}