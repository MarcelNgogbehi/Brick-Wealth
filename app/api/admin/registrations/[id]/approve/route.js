// app/api/admin/registrations/[id]/approve/route.js
//
// POST /api/admin/registrations/{id}/approve
// Approves a pending registration → mints the continue-link token →
// sends the registration email → advances the referral edge (if any).

import { successResponse, errorResponse, verifyCsrf, generateToken, hashToken, TOKEN_TTL_MS } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import {
  findUserById,
  approveRegistration,
  createAuthToken,
  invalidateUserTokens,
  syncReferralStatus,
} from "@/lib/db";
import { sendRegistrationEmail } from "@/lib/email";
import { log } from "@/lib/logger";

export async function POST(request, { params }) {
  return adminRoute(async () => {
    const admin = await requireAdmin();

    if (!verifyCsrf(request)) {
      return errorResponse("Invalid request", 403);
    }

    const { id } = await params;

    try {
      const user = await findUserById(id);
      if (!user || user.role !== "investor") {
        return errorResponse("Registration not found", 404);
      }
      if (user.registrationStatus !== "pending") {
        return errorResponse(`Already ${user.registrationStatus}`, 409);
      }

      // 1) Approve
      await approveRegistration(id);

      // 2) Mint a fresh register token (continue-link); clear stale ones
      await invalidateUserTokens(id, "register").catch(() => {});
      const rawToken = generateToken();
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
      await createAuthToken({ userId: id, tokenHash, type: "register", expiresAt });

      // 3) Send the continue-link email (now, on approval)
      let emailSent = true;
      try {
        await sendRegistrationEmail({ to: user.email, fullName: user.fullName, token: rawToken });
      } catch (emailErr) {
        emailSent = false;
        log.error("admin.registrations.approve.email_failed", { userId: id, error: emailErr?.message });
      }

      // 4) Advance referral edge → APPROVED (no-op if not referred)
      await syncReferralStatus({ refereeUserId: id, status: "APPROVED" }).catch(() => {});

      await logAdminAction({
        adminId: admin.id,
        action: "registration.approved",
        entityType: "User",
        entityId: id,
        after: { registrationStatus: "approved", emailSent },
        request,
      });

      return successResponse({
        message: emailSent
          ? "Approved. Verification email sent."
          : "Approved, but the email failed to send.",
        emailSent,
      });
    } catch (err) {
      log.error("admin.registrations.approve_error", { userId: id, error: err?.message });
      return errorResponse("Failed to approve registration", 500);
    }
  });
}