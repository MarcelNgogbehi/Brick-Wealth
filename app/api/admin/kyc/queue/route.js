// app/api/admin/kyc/queue/route.js
//
// GET /api/admin/kyc/queue
// Returns users with kycStatus = "pending_review" and their documents.

import { successResponse } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { getKycQueue } from "@/lib/db";

export async function GET(request) {
  return adminRoute(async () => {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

    const queue = await getKycQueue({ limit });

    // Trim sensitive fields
    const cleaned = queue.map((u) => ({
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      username: u.username,
      country: u.country,
      residency: u.residency,
      kycStatus: u.kycStatus,
      submittedAt: u.onboardingProgress?.kycSubmittedAt,
      createdAt: u.createdAt,
      kycDocuments: u.kycDocuments,
      // Quick summary
      documentsCount: u.kycDocuments.length,
      pendingCount: u.kycDocuments.filter((d) => d.reviewStatus === "pending").length,
      approvedCount: u.kycDocuments.filter((d) => d.reviewStatus === "approved").length,
      rejectedCount: u.kycDocuments.filter((d) => d.reviewStatus === "rejected").length,
    }));

    return successResponse({
      queue: cleaned,
      total: cleaned.length,
    });
  });
}