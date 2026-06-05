// app/api/admin/spvs/available-properties/route.js
//
// GET /api/admin/spvs/available-properties
// Returns properties that don't yet have an SPV — used in SPV creation form.

import { successResponse } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { listAvailableProperties } from "@/lib/db";

export async function GET() {
  return adminRoute(async () => {
    await requireAdmin();
    const properties = await listAvailableProperties();
    return successResponse({ properties });
  });
}