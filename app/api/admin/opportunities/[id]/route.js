// app/api/admin/opportunities/[id]/route.js
//
// GET    /api/admin/opportunities/[id] — full opportunity with SPV/property/docs
// PATCH  /api/admin/opportunities/[id] — update fields
// DELETE /api/admin/opportunities/[id] — delete (SPV remains)

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { getOpportunityById, updateOpportunity, deleteOpportunity } from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { log } from "@/lib/logger";

// ────────────────────────────────────────────────────────────────────
// GET
// ────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  return adminRoute(async () => {
    await requireAdmin();
    const { id } = await params;

    const opportunity = await getOpportunityById(id);
    if (!opportunity) return errorResponse("Opportunity not found", 404);

    return successResponse({ opportunity });
  });
}

// ────────────────────────────────────────────────────────────────────
// PATCH
// ────────────────────────────────────────────────────────────────────
const UpdateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  subtitle: z.string().max(300).nullable().optional(),
  summary: z.string().max(1000).nullable().optional(),
  fullDescription: z.string().max(20000).nullable().optional(),
  riskWarning: z.string().max(5000).nullable().optional(),
  targetYieldPct: z.number().min(0).max(100).nullable().optional(),
  termMonths: z.number().int().min(0).max(600).nullable().optional(),
  projectedReturnPct: z.number().min(0).max(1000).nullable().optional(),
  requiresKyc: z.boolean().optional(),
  eligibleInvestorTypes: z.array(z.enum(["retail", "sophisticated", "hnw"]))
    .min(1, "At least one investor type required").optional(),
  requiresSuitabilityCheck: z.boolean().optional(),
  suitabilityQuestions: z.any().nullable().optional(),
  openDate: z.string().nullable().optional(),
  closeDate: z.string().nullable().optional(),
  heroImageUrl: z.string().url().nullable().optional(),
  walkthroughVideoUrl: z.string().url().nullable().optional(),
}).strict();

export async function PATCH(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

    const admin = await requireAdmin();
    const { id } = await params;

    const before = await getOpportunityById(id);
    if (!before) return errorResponse("Opportunity not found", 404);

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

    const parsed = UpdateSchema.safeParse(cleaned);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message || "Invalid input",
        400,
        Object.fromEntries(parsed.error.issues.map((i) => [i.path.join("."), i.message]))
      );
    }

    try {
      const updated = await updateOpportunity(id, parsed.data);

      await logAdminAction({
        adminId: admin.id,
        action: "opportunity.updated",
        entityType: "opportunity",
        entityId: id,
        before: {
          title: before.title,
          status: before.status,
        },
        after: {
          title: updated.title,
          status: updated.status,
        },
        metadata: { fieldsChanged: Object.keys(parsed.data) },
        request,
      });

      return successResponse({ opportunity: updated });
    } catch (err) {
      log.error("opportunity.update.error", { error: err?.message });
      return errorResponse("Failed to update opportunity", 500);
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

    const opp = await getOpportunityById(id);
    if (!opp) return errorResponse("Opportunity not found", 404);

    // Don't allow deleting funded opportunities (legal record)
    if (opp.status === "funded") {
      return errorResponse(
        "Cannot delete a funded opportunity. Archive it instead.",
        409
      );
    }

    try {
      await deleteOpportunity(id);

      await logAdminAction({
        adminId: admin.id,
        action: "opportunity.deleted",
        entityType: "opportunity",
        entityId: id,
        before: {
          title: opp.title,
          status: opp.status,
        },
        request,
      });

      return successResponse({ message: "Opportunity deleted" });
    } catch (err) {
      log.error("opportunity.delete.error", { error: err?.message });
      return errorResponse("Failed to delete opportunity", 500);
    }
  });
}