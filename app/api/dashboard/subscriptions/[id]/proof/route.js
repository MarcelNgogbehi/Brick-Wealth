// app/api/dashboard/subscriptions/[id]/proof/route.js
//
// POST /api/dashboard/subscriptions/[id]/proof
// Body: { fileUrl, fileName }
//
// Records a proof-of-payment URL on the subscription and moves it into
// UNDER_REVIEW so it surfaces in the admin queue.
//
// UPLOAD MODEL:
//   The actual file upload happens client-side via UploadThing (same as
//   KYC + property images). The client uploads, gets back a URL, then
//   POSTs that URL here. This route just records + transitions.
//
//   This mirrors how your KYC upload flow already works — no raw file
//   bytes touch this endpoint.
//
// SECURITY: ownership enforced; only pre-processed subscriptions accept proof.

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { recordSubscriptionProofOfPayment } from "@/lib/db";

const Schema = z.object({
  fileUrl: z.string().url(),
  fileName: z.string().min(1).max(255),
}).strict();

export async function POST(request, { params }) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const user = await requireDashboardUser();
    const { id } = await params;

    let raw;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid body" },
        { status: 400 }
      );
    }

    const parsed = Schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    try {
      const updated = await recordSubscriptionProofOfPayment({
        subscriptionId: id,
        userId: user.id,
        fileUrl: parsed.data.fileUrl,
        fileName: parsed.data.fileName,
      });

      return NextResponse.json({
        success: true,
        subscription: {
          id: updated.id,
          status: updated.status,
          proofOfPaymentUrl: updated.proofOfPaymentUrl,
          proofUploadedAt: updated.proofUploadedAt,
        },
        message: "Proof of payment uploaded. Our team will verify it shortly.",
      });
    } catch (err) {
      const msg = err?.message || "Failed to record proof of payment";
      return NextResponse.json(
        { success: false, message: msg },
        { status: 400 }
      );
    }
  });
}