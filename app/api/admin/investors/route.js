// app/api/admin/investors/route.js
//
// GET /api/admin/investors?search=...&kycStatus=...&page=1&pageSize=25
// Returns paginated list of investors.

import { successResponse } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { listInvestors } from "@/lib/db";

export async function GET(request) {
  return adminRoute(async () => {
    await requireAdmin();

    const { searchParams } = new URL(request.url);

    const opts = {
      search: searchParams.get("search") || undefined,
      kycStatus: searchParams.get("kycStatus") || undefined,
      country: searchParams.get("country") || undefined,
      tag: searchParams.get("tag") || undefined,
      sortBy: searchParams.get("sortBy") || "newest",
      page: parseInt(searchParams.get("page") || "1", 10),
      pageSize: Math.min(parseInt(searchParams.get("pageSize") || "25", 10), 100),
    };

    // Parse boolean filters
    const flaggedParam = searchParams.get("flagged");
    if (flaggedParam === "true") opts.flagged = true;
    if (flaggedParam === "false") opts.flagged = false;

    const result = await listInvestors(opts);
    return successResponse(result);
  });
}