// app/api/admin/spvs/[id]/route.js
//
// GET    /api/admin/spvs/[id] — single SPV with property + mortgage
// PATCH  /api/admin/spvs/[id] — update SPV fields
// DELETE /api/admin/spvs/[id] — delete SPV (cascades mortgage)

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import {
  getSpvById,
  updateSpv,
  deleteSpv,
  getSpvByCompanyNumber,
} from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { log } from "@/lib/logger";

// ────────────────────────────────────────────────────────────────────
// GET
// ────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  return adminRoute(async () => {
    await requireAdmin();
    const { id } = await params;

    const spv = await getSpvById(id);
    if (!spv) return errorResponse("SPV not found", 404);

    // Convert Decimals to strings for safe JSON
    const safe = {
      ...spv,
      targetRaiseAmount: spv.targetRaiseAmount?.toString(),
      unitPrice: spv.unitPrice?.toString(),
      mortgage: spv.mortgage
        ? {
            ...spv.mortgage,
            principalAmount: spv.mortgage.principalAmount?.toString(),
            monthlyPaymentEst: spv.mortgage.monthlyPaymentEst?.toString() || null,
          }
        : null,
    };

    return successResponse({ spv: safe });
  });
}

// ────────────────────────────────────────────────────────────────────
// PATCH
// ────────────────────────────────────────────────────────────────────
const UpdateSpvSchema = z.object({
  spvName: z.string().min(2).max(200).optional(),
  companyNumber: z.string().min(4).max(20).optional(),
  jurisdiction: z.string().max(50).optional(),
  incorporatedOn: z.string().nullable().optional(),
  registeredAddress: z.string().max(500).nullable().optional(),
  purpose: z.string().max(2000).nullable().optional(),
  currency: z.enum(["GBP", "USD", "EUR"]).optional(),
  targetRaiseAmount: z.number().min(1).max(1_000_000_000).optional(),
  unitPrice: z.number().min(0.01).max(1_000_000).optional(),
  totalUnits: z.number().int().min(1).max(1_000_000).optional(),
  minimumUnits: z.number().int().min(1).max(1_000_000).optional(),
  openDate: z.string().nullable().optional(),
  closeDate: z.string().nullable().optional(),
  bankAccountReference: z.string().max(100).nullable().optional(),
  bankAccountName: z.string().max(200).nullable().optional(),
  status: z.enum(["draft", "active", "closed"]).optional(),
}).strict();

export async function PATCH(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

    const admin = await requireAdmin();
    const { id } = await params;

    const before = await getSpvById(id);
    if (!before) return errorResponse("SPV not found", 404);

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

    const parsed = UpdateSpvSchema.safeParse(cleaned);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message || "Invalid input",
        400,
        Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message]))
      );
    }

    // If changing company number, check it's not taken by another SPV
    if (parsed.data.companyNumber && parsed.data.companyNumber !== before.companyNumber) {
      const taken = await getSpvByCompanyNumber(parsed.data.companyNumber);
      if (taken && taken.id !== id) {
        return errorResponse("Company number already in use", 409, {
          companyNumber: "Already in use",
        });
      }
    }

    try {
      const updated = await updateSpv(id, parsed.data);

      await logAdminAction({
        adminId: admin.id,
        action: "spv.updated",
        entityType: "spv",
        entityId: id,
        before: {
          spvName: before.spvName,
          status: before.status,
          targetRaiseAmount: before.targetRaiseAmount?.toString(),
        },
        after: {
          spvName: updated.spvName,
          status: updated.status,
          targetRaiseAmount: updated.targetRaiseAmount?.toString(),
        },
        metadata: { fieldsChanged: Object.keys(parsed.data) },
        request,
      });

      return successResponse({
        spv: {
          ...updated,
          targetRaiseAmount: updated.targetRaiseAmount?.toString(),
          unitPrice: updated.unitPrice?.toString(),
        },
      });
    } catch (err) {
      log.error("spv.update.error", { error: err?.message });
      return errorResponse("Failed to update SPV", 500);
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
    const { id } = await params;

    const spv = await getSpvById(id);
    if (!spv) return errorResponse("SPV not found", 404);

    // Protect against deleting active SPVs that may have subscriptions
    if (spv.status === "active") {
      return errorResponse(
        "Cannot delete an active SPV. Set status to 'closed' or 'draft' first.",
        409
      );
    }

    try {
      await deleteSpv(id);

      await logAdminAction({
        adminId: admin.id,
        action: "spv.deleted",
        entityType: "spv",
        entityId: id,
        before: {
          spvName: spv.spvName,
          companyNumber: spv.companyNumber,
        },
        request,
      });

      return successResponse({ message: "SPV deleted" });
    } catch (err) {
      log.error("spv.delete.error", { error: err?.message });
      return errorResponse("Failed to delete SPV", 500);
    }
  });
}