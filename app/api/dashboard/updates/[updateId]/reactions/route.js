// app/api/dashboard/updates/[updateId]/reactions/route.js
//
// POST /api/dashboard/updates/[updateId]/reactions
// Body: { type: "heart" | "clap" | "acknowledge" }
//
// Toggles a reaction. Returns the new state for the type.
// SECURITY: Verifies the update exists, is published, and the user can
// see the parent opportunity.

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  getPropertyUpdateById,
  getOpportunityForInvestor,
  toggleReaction,
  REACTION_TYPES,
} from "@/lib/db";

const Schema = z.object({
  type: z.enum(REACTION_TYPES),
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
    const { updateId } = await params;

    const update = await getPropertyUpdateById(updateId);
    if (!update || update.deletedAt || !update.publishedAt) {
      return NextResponse.json(
        { success: false, message: "Update not found" },
        { status: 404 }
      );
    }

    // Verify user can see the parent opportunity
    const opp = await getOpportunityForInvestor({
      opportunityId: update.opportunityId,
      userId: user.id,
    });
    if (!opp) {
      return NextResponse.json(
        { success: false, message: "Forbidden" },
        { status: 403 }
      );
    }

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
        { success: false, message: "Invalid reaction type" },
        { status: 400 }
      );
    }

    try {
      const result = await toggleReaction({
        updateId,
        userId: user.id,
        type: parsed.data.type,
      });
      return NextResponse.json({ success: true, ...result });
    } catch (err) {
      console.error("[reactions.toggle] error:", err?.message);
      return NextResponse.json(
        { success: false, message: "Failed to toggle reaction" },
        { status: 500 }
      );
    }
  });
}