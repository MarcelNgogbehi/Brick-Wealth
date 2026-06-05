// app/api/admin/kyc/[docId]/approve/route.js
//
// POST /api/admin/kyc/[docId]/approve
// Approves a single KYC document and recomputes the user's overall status.
//
// PHASE 4 MSG 2 — HOOK B:
//   When the recomputed kycStatus becomes "approved" (the user passes the
//   final required-document threshold), we fire a security_alert notification
//   to celebrate activation. Security alerts can't be disabled so this
//   reliably reaches the investor.

import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import {
  getKycDocument,
  approveKycDocument,
  recomputeUserKycStatus,
} from "@/lib/db";
import { logAdminAction, AUDIT_ACTIONS } from "@/lib/audit";
import { notifyUser, NOTIFY } from "@/lib/notify";

export async function POST(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return errorResponse("Invalid request", 403);
    }

    const admin = await requireAdmin();
    const { docId } = await params;

    const doc = await getKycDocument(docId);
    if (!doc) {
      return errorResponse("Document not found", 404);
    }

    if (doc.reviewStatus === "approved") {
      return successResponse({
        message: "Already approved",
        doc,
      });
    }

    const before = {
      reviewStatus: doc.reviewStatus,
      rejectionReason: doc.rejectionReason,
    };

    // Capture user's PREVIOUS overall KYC status before recompute,
    // so we can detect the "newly fully approved" transition.
    const previousUserKycStatus = doc.user?.kycStatus || "not_started";

    const updated = await approveKycDocument({
      docId,
      reviewerAdminId: admin.id,
    });

    // Recompute the user's overall KYC status
    const kycResult = await recomputeUserKycStatus(doc.userId);

    await logAdminAction({
      adminId: admin.id,
      action: AUDIT_ACTIONS.KYC_APPROVED,
      entityType: "kyc_document",
      entityId: docId,
      before,
      after: {
        reviewStatus: updated.reviewStatus,
      },
      metadata: {
        userId: doc.userId,
        documentType: doc.documentType,
        newUserKycStatus: kycResult.newStatus,
      },
      request,
    });

    // PHASE 4 MSG 2 — HOOK B
    // Fire-and-forget: if this approval flipped the user from
    // "pending_review" / "rejected" / "not_started" to "approved",
    // celebrate with a security alert (always-on category).
    if (
      kycResult.newStatus === "approved" &&
      previousUserKycStatus !== "approved"
    ) {
      notifyUser({
        userId: doc.userId,
        category: NOTIFY.SECURITY_ALERT,
        title: "Your account is fully activated",
        body: "Your KYC verification has been approved. You can now subscribe to opportunities on Bricks & Wealth.",
        link: "/dashboard",
        metadata: { kycStatus: "approved" },
      }).catch((err) => console.error("[kyc.approve.notify] error:", err?.message));
    }

    return successResponse({
      message: "Document approved",
      doc: updated,
      userKycStatus: kycResult,
    });
  });
}