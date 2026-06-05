// app/api/dashboard/opportunities/[id]/doc-view/route.js
//
// POST /api/dashboard/opportunities/[id]/doc-view
// Body: { documentId: string }
//
// Records that the investor opened/downloaded a document.
// Used for FCA compliance: prove the investor reviewed required docs
// before subscribing (Phase 5 enforcement).
//
// SECURITY:
// - Validates doc belongs to this opportunity
// - Validates opportunity is live + eligible (via getOpportunityForInvestor)
// - Records IP + user agent
// - Idempotent (multiple views just create multiple log rows)

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import {
  requireDashboardUser,
  dashboardRoute,
  getRequestContext,
} from "@/lib/dashboard-auth";
import {
  getOpportunityForInvestor,
  recordDocumentView,
} from "@/lib/db";

const BodySchema = z.object({
  documentId: z.string().min(1, "documentId required"),
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
    const { id: opportunityId } = await params;

    let raw;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid body" },
        { status: 400 }
      );
    }

    const parsed = BodySchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: "Invalid input" },
        { status: 400 }
      );
    }

    // Validate opportunity is live + eligible
    const opp = await getOpportunityForInvestor({
      opportunityId,
      userId: user.id,
    });
    if (!opp) {
      return NextResponse.json(
        { success: false, message: "Opportunity not found" },
        { status: 404 }
      );
    }

    // Validate the doc actually belongs to this opportunity
    const docExists = opp.documents?.some((d) => d.id === parsed.data.documentId);
    if (!docExists) {
      return NextResponse.json(
        { success: false, message: "Document not found" },
        { status: 404 }
      );
    }

    const { ipAddress, userAgent } = getRequestContext(request);

    await recordDocumentView({
      documentId: parsed.data.documentId,
      opportunityId,
      userId: user.id,
      ipAddress,
      userAgent,
    });

    return NextResponse.json({ success: true });
  });
}