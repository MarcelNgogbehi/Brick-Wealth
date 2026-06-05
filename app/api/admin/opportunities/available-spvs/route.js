// app/api/admin/opportunities/available-spvs/route.js
//
// GET /api/admin/opportunities/available-spvs
// Returns SPVs that are not yet linked to any opportunity.
// Used by the New Opportunity form to populate the SPV picker.

import { successResponse, errorResponse } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { listSpvsAvailableForOpportunity } from "@/lib/db";

export async function GET() {
  return adminRoute(async () => {
    await requireAdmin();

    const spvs = await listSpvsAvailableForOpportunity();

    return successResponse({
      spvs: spvs.map((s) => ({
        ...s,
        targetRaiseAmount: s.targetRaiseAmount?.toString() ?? null,
      })),
    });
  });
}
