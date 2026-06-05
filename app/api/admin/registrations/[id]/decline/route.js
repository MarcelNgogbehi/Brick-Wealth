// app/api/admin/registrations/[id]/decline/route.js
//
// POST /api/admin/registrations/{id}/decline   body: { reason?: string }
// Declines a pending registration → advances the referral edge to DECLINED.
//
// NOTE: there is no decline-email helper in lib/email.js. If you want to
// notify declined applicants, add a sendRegistrationDeclinedEmail({ to,
// fullName, reason }) to lib/email.js and call it where marked below.

import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import {
  findUserById,
  declineRegistration,
  syncReferralStatus,
} from "@/lib/db";
import { log } from "@/lib/logger";

export async function POST(request, { params }) {
  return adminRoute(async () => {
    const admin = await requireAdmin();

    if (!verifyCsrf(request)) {
      return errorResponse("Invalid request", 403);
    }

    const { id } = await params;

    let reason;
    try {
      const body = await request.json().catch(() => ({}));
      reason = typeof body?.reason === "string" ? body.reason.trim() : undefined;
    } catch {
      reason = undefined;
    }

    try {
      const user = await findUserById(id);
      if (!user || user.role !== "investor") {
        return errorResponse("Registration not found", 404);
      }
      if (user.registrationStatus !== "pending") {
        return errorResponse(`Already ${user.registrationStatus}`, 409);
      }

      await declineRegistration(id);

      // Advance referral edge → DECLINED (no-op if not referred)
      await syncReferralStatus({ refereeUserId: id, status: "DECLINED" }).catch(() => {});

      // OPTIONAL: notify the applicant. Uncomment once you add the helper.
      // try {
      //   await sendRegistrationDeclinedEmail({ to: user.email, fullName: user.fullName, reason });
      // } catch (e) {
      //   log.error("admin.registrations.decline.email_failed", { userId: id, error: e?.message });
      // }

      await logAdminAction({
        adminId: admin.id,
        action: "registration.declined",
        entityType: "User",
        entityId: id,
        after: { registrationStatus: "declined", reason: reason || null },
        request,
      });

      return successResponse({ message: "Declined." });
    } catch (err) {
      log.error("admin.registrations.decline_error", { userId: id, error: err?.message });
      return errorResponse("Failed to decline registration", 500);
    }
  });
}