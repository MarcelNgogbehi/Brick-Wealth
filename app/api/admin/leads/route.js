// app/api/admin/leads/route.js
//
// GET /api/admin/leads?status=&search=
// Returns "Register Interest" submissions for the admin Leads dashboard,
// plus per-status counts for the header chips.

import { successResponse, errorResponse } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { getLeads, getLeadStatusCounts } from "@/lib/db";
import { log } from "@/lib/logger";

export async function GET(request) {
  return adminRoute(async () => {
    await requireAdmin();

    try {
      const { searchParams } = new URL(request.url);
      const status = searchParams.get("status") || null;
      const search = searchParams.get("search") || null;

      const [leads, counts] = await Promise.all([
        getLeads({ status, search, limit: 300 }),
        getLeadStatusCounts(),
      ]);

      return successResponse({ leads, counts, total: leads.length });
    } catch (err) {
      log.error("admin.leads.list_error", { error: err?.message });
      return errorResponse("Failed to load leads", 500);
    }
  });
}
