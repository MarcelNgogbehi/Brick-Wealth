// app/api/admin/registrations/route.js
//
// GET /api/admin/registrations
// Returns all users with registrationStatus = "pending", each annotated
// with referral context (who introduced them) for the approval screen.

import { successResponse, errorResponse } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { getPendingRegistrations, getReferralContextForUser } from "@/lib/db";
import { log } from "@/lib/logger";

export async function GET() {
  return adminRoute(async () => {
    await requireAdmin();

    try {
      const registrations = await getPendingRegistrations({ limit: 200 });

      // Phase 7: attach referral context (who referred them) per row.
      const withContext = await Promise.all(
        registrations.map(async (u) => {
          const ctx = await getReferralContextForUser(u.id).catch(() => null);
          return {
            ...u,
            referredBy: ctx?.referredBy || null,
            directReferralCount: ctx?.directReferralCount || 0,
          };
        })
      );

      return successResponse({ registrations: withContext, total: withContext.length });
    } catch (err) {
      log.error("admin.registrations.list_error", { error: err?.message });
      return errorResponse("Failed to load registrations", 500);
    }
  });
}