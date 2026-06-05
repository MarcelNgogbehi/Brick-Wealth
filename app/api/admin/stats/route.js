// app/api/admin/stats/route.js
//
// GET /api/admin/stats
// Returns dashboard statistics for the admin home page.

import { successResponse, errorResponse } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { getAdminDashboardStats, getAdminDashboardInsights } from "@/lib/db";
import { log } from "@/lib/logger";

export async function GET() {
  return adminRoute(async () => {
    await requireAdmin();

    try {
      // Insights are best-effort — never let a heavy aggregate take down the
      // core stat counters the dashboard depends on.
      const [stats, insights] = await Promise.all([
        getAdminDashboardStats(),
        getAdminDashboardInsights().catch((err) => {
          log.error("admin.stats.insights_error", { error: err?.message });
          return null;
        }),
      ]);
      return successResponse({ stats, insights });
    } catch (err) {
      log.error("admin.stats.error", { error: err?.message });
      return errorResponse("Failed to load stats", 500);
    }
  });
}