// app/api/admin/subscriptions/[id]/allocate/route.js
//
// POST /api/admin/subscriptions/[id]/allocate
// Body: { unitsAllocated, notes? }
//
// Creates an allocation (splittable). The subscription must be FUNDED
// (or already PARTIALLY_ALLOCATED for a follow-up split).
//
// createAllocation() (lib/db.js, Msg 1):
//   - validates units don't exceed remaining
//   - creates the allocation + certificate number (BW-HC-NNNN)
//   - updates subscription status (PARTIALLY/FULLY_ALLOCATED)
//   - increments Spv.unitsAllocated
//   - recomputes the investor's Holding
//   - logs a subscription audit event
//
// PHASE 5 MSG 4 — after allocation:
//   - generate the certificate PDF + upload it (best-effort)
//   - generate the subscription agreement on full allocation
//   - notify the investor (cert ready)
//   - welcome notification on first investment
//
// REQUIRES lib/server-upload.js (uploadServerFile). See SETUP guide.

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import { logAdminAction } from "@/lib/audit";
import {
  getSubscriptionForAdmin,
  createAllocation,
  generateCertificateForAllocation,
  generateAgreementForSubscription,
  countUserAllocations,
} from "@/lib/db";
import {
  notifySubscriptionAllocated,
  notifyWelcomeFirstInvestment,
} from "@/lib/notify";
import { uploadServerFile } from "@/lib/server-upload";

const Schema = z.object({
  unitsAllocated: z.number().int().positive(),
  notes: z.string().max(2000).optional(),
}).strict();

export async function POST(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const admin = await requireAdmin();
    const { id } = await params;

    // Pre-check status
    const sub = await getSubscriptionForAdmin(id);
    if (!sub) {
      return NextResponse.json(
        { success: false, message: "Subscription not found" },
        { status: 404 }
      );
    }
    if (!["FUNDED", "PARTIALLY_ALLOCATED"].includes(sub.status)) {
      return NextResponse.json(
        {
          success: false,
          message: `Cannot allocate — subscription must be FUNDED first (currently ${sub.status}).`,
        },
        { status: 400 }
      );
    }

    let raw;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json({ success: false, message: "Invalid body" }, { status: 400 });
    }

    const parsed = Schema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    try {
      // 1. Create the allocation (assigns certificate number, recomputes holding)
      const result = await createAllocation({
        subscriptionId: id,
        unitsAllocated: parsed.data.unitsAllocated,
        confirmedById: admin.id,
        notes: parsed.data.notes,
      });

      const fullyAllocated = result.subscription.status === "FULLY_ALLOCATED";

      // 2. Detect first-ever investment. countUserAllocations now includes
      //    the new allocation, so a count of 1 means this is the first.
      const allocationCount = await countUserAllocations(sub.investor.id).catch(() => 0);
      const isFirstInvestment = allocationCount === 1;

      // 3. Generate certificate PDF (best-effort — never block allocation)
      let certificateUrl = null;
      try {
        const cert = await generateCertificateForAllocation({
          allocationId: result.allocation.id,
          uploadFn: uploadServerFile,
        });
        certificateUrl = cert.certificateUrl;
      } catch (certErr) {
        console.error("[allocate] certificate generation failed:", certErr?.message);
        // Allocation still succeeded; certificate can be regenerated later
        // (the download route regenerates on demand).
      }

      // 4. On full allocation, generate the subscription agreement
      if (fullyAllocated) {
        try {
          await generateAgreementForSubscription({
            subscriptionId: id,
            uploadFn: uploadServerFile,
          });
        } catch (agErr) {
          console.error("[allocate] agreement generation failed:", agErr?.message);
        }
      }

      // 5. Notify the investor (cert ready)
      notifySubscriptionAllocated({
        userId: sub.investor.id,
        opportunityTitle: sub.opportunity?.title || "your investment",
        subscriptionId: id,
        units: parsed.data.unitsAllocated,
        certificateNumber: result.allocation.certificateNumber,
        fullyAllocated,
      });

      // 6. Welcome on first investment
      if (isFirstInvestment) {
        notifyWelcomeFirstInvestment({
          userId: sub.investor.id,
          opportunityTitle: sub.opportunity?.title || "your first investment",
        });
      }

      // 7. Admin audit
      await logAdminAction({
        adminId: admin.id,
        action: "subscription.allocated",
        entityType: "subscription",
        entityId: id,
        metadata: {
          allocationId: result.allocation.id,
          unitsAllocated: parsed.data.unitsAllocated,
          certificateNumber: result.allocation.certificateNumber,
          newStatus: result.subscription.status,
          certificateGenerated: !!certificateUrl,
        },
        request,
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        allocation: {
          id: result.allocation.id,
          unitsAllocated: result.allocation.unitsAllocated,
          certificateNumber: result.allocation.certificateNumber,
          certificateUrl,
        },
        subscription: { id: result.subscription.id, status: result.subscription.status },
        holding: result.holding
          ? { totalUnits: result.holding.totalUnits, ownershipPct: result.holding.ownershipPct }
          : null,
        message: `Allocated ${parsed.data.unitsAllocated} units · ${result.allocation.certificateNumber}${certificateUrl ? " · certificate issued" : " · certificate pending"}`,
      });
    } catch (err) {
      const msg = err?.message || "Allocation failed";
      return NextResponse.json({ success: false, message: msg }, { status: 400 });
    }
  });
}