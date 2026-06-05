// app/api/dashboard/allocations/[id]/certificate/route.js
//
// GET /api/dashboard/allocations/:id/certificate
//
// Returns the share certificate PDF for the authenticated investor.
// If the URL was already generated and stored, redirects immediately.
// If not (generation failed at allocation time), regenerates the PDF,
// saves the URL, then redirects — so the investor always gets the file.

import { NextResponse } from "next/server";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  getCertificateUrlForInvestor,
  generateCertificateForAllocation,
} from "@/lib/db";
import { uploadServerFile } from "@/lib/server-upload";

export async function GET(request, { params }) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const { id } = await params;

    const record = await getCertificateUrlForInvestor({ allocationId: id, userId: user.id });
    if (!record) {
      return NextResponse.json({ success: false, message: "Certificate not found" }, { status: 404 });
    }

    // Already stored — redirect straight to the file
    if (record.certificateUrl) {
      return NextResponse.redirect(record.certificateUrl);
    }

    // PDF generation failed at allocation time — regenerate now
    try {
      const { certificateUrl } = await generateCertificateForAllocation({
        allocationId: id,
        uploadFn: uploadServerFile,
      });
      return NextResponse.redirect(certificateUrl);
    } catch (err) {
      console.error("[certificate] regeneration failed:", err?.message);
      return NextResponse.json(
        { success: false, message: "Certificate could not be generated. Please try again shortly." },
        { status: 500 }
      );
    }
  });
}
