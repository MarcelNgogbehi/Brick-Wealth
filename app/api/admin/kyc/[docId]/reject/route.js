// app/api/admin/kyc/[docId]/reject/route.js
//
// POST /api/admin/kyc/[docId]/reject
// Body: { reason: string }
// Rejects a document with a required reason.

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import {
  getKycDocument,
  rejectKycDocument,
  recomputeUserKycStatus,
} from "@/lib/db";
import { logAdminAction, AUDIT_ACTIONS } from "@/lib/audit";

const RejectSchema = z.object({
  reason: z.string()
    .min(3, "Please provide a reason (min 3 characters)")
    .max(500, "Reason too long"),
}).strict();

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

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = RejectSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse(
        parsed.error.issues[0]?.message || "Reason required",
        400,
        { reason: parsed.error.issues[0]?.message }
      );
    }

    const before = {
      reviewStatus: doc.reviewStatus,
      rejectionReason: doc.rejectionReason,
    };

    const updated = await rejectKycDocument({
      docId,
      reviewerAdminId: admin.id,
      reason: parsed.data.reason,
    });

    const kycResult = await recomputeUserKycStatus(doc.userId);

    await logAdminAction({
      adminId: admin.id,
      action: AUDIT_ACTIONS.KYC_REJECTED,
      entityType: "kyc_document",
      entityId: docId,
      before,
      after: {
        reviewStatus: updated.reviewStatus,
        rejectionReason: updated.rejectionReason,
      },
      metadata: {
        userId: doc.userId,
        documentType: doc.documentType,
        newUserKycStatus: kycResult.newStatus,
      },
      request,
    });

    return successResponse({
      message: "Document rejected",
      doc: updated,
      userKycStatus: kycResult,
    });
  });
}