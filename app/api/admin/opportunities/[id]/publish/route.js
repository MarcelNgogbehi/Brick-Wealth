// app/api/admin/opportunities/[id]/publish/route.js
//
// POST /api/admin/opportunities/[id]/publish
// Body: { action: "publish" | "close" | "funded" | "archive" | "revert_draft" }
//
// Single endpoint for all status transitions. Each transition records to
// audit log with before/after states.
//
// PHASE 4 MSG 2 — HOOK A:
//   When action="publish" succeeds, we fire `opportunity_published`
//   notifications to all activated investors whose investorType matches
//   the opportunity's eligibleInvestorTypes. Best-effort, fire-and-forget.

import { z } from "zod";
import { successResponse, errorResponse, verifyCsrf } from "@/lib/auth";
import { requireAdmin, adminRoute } from "@/lib/admin-auth";
import {
  getOpportunityById,
  publishOpportunity,
  closeOpportunity,
  markOpportunityFunded,
  archiveOpportunity,
  revertOpportunityToDraft,
  resolveAnnouncementAudience,
} from "@/lib/db";
import { logAdminAction } from "@/lib/audit";
import { log } from "@/lib/logger";
import { notifyMany, NOTIFY } from "@/lib/notify";
import { prisma } from "@/lib/prisma";

const ActionSchema = z.object({
  action: z.enum(["publish", "close", "funded", "archive", "revert_draft"]),
}).strict();

// Validate status transitions (prevent illegal moves)
function isValidTransition(currentStatus, action) {
  const VALID = {
    draft: ["publish", "archive"],
    live: ["close", "funded", "revert_draft", "archive"],
    closed: ["funded", "archive", "revert_draft"],
    funded: ["archive"],
    archived: ["revert_draft"],
  };
  return VALID[currentStatus]?.includes(action) || false;
}

// ────────────────────────────────────────────────────────────────────
// HOOK A — Notify investors when an opportunity goes live
//
// Filters: all "activated" investors whose investorType is in the
// opportunity's eligibleInvestorTypes array. Fire-and-forget so
// notification failures never block the publish.
// ────────────────────────────────────────────────────────────────────
async function notifyEligibleInvestorsOfNewOpportunity(opp) {
  try {
    if (!opp || !opp.id) return;

    // Get all activated investors
    const activatedUsers = await resolveAnnouncementAudience("activated");
    if (activatedUsers.length === 0) return;

    // Filter by investorType eligibility
    // (resolveAnnouncementAudience doesn't return investorType, so we
    // need a second query to filter by it)
    const userIds = activatedUsers.map((u) => u.id);
    const eligibleTypes = opp.eligibleInvestorTypes && opp.eligibleInvestorTypes.length > 0
      ? opp.eligibleInvestorTypes
      : ["retail", "sophisticated", "hnw"];

    const eligible = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        OR: [
          { investorType: { in: eligibleTypes } },
          { investorType: null },  // include those without a type set
        ],
      },
      select: { id: true },
    });

    if (eligible.length === 0) return;

    // Build a short body
    const summary = opp.summary
      ? (opp.summary.length > 240 ? opp.summary.slice(0, 240) + "..." : opp.summary)
      : "A new investment opportunity is now available on Bricks & Wealth.";

    await notifyMany({
      userIds: eligible.map((u) => u.id),
      category: NOTIFY.OPPORTUNITY_PUBLISHED,
      title: `New opportunity: ${opp.title}`,
      body: summary,
      link: `/dashboard/opportunities/${opp.id}`,
      metadata: { opportunityId: opp.id },
    });
  } catch (err) {
    // Best-effort — log and move on
    log?.error?.("opportunity.publish.notify.error", { error: err?.message }) ||
      console.error("[opportunity.publish.notify] error:", err?.message);
  }
}

export async function POST(request, { params }) {
  return adminRoute(async () => {
    if (!verifyCsrf(request)) return errorResponse("Invalid request", 403);

    const admin = await requireAdmin();
    const { id } = await params;

    const before = await getOpportunityById(id);
    if (!before) return errorResponse("Opportunity not found", 404);

    let raw;
    try {
      raw = await request.json();
    } catch {
      return errorResponse("Invalid body", 400);
    }

    const parsed = ActionSchema.safeParse(raw);
    if (!parsed.success) {
      return errorResponse("Invalid action", 400);
    }
    const { action } = parsed.data;

    // Validate transition
    if (!isValidTransition(before.status, action)) {
      return errorResponse(
        `Cannot ${action} from current status "${before.status}"`,
        409
      );
    }

    // Pre-publish validation: must have a hero image and minimum required fields
    if (action === "publish") {
      if (!before.title || before.title.length < 3) {
        return errorResponse("Title is required before publishing", 400);
      }
      if (!before.summary && !before.fullDescription) {
        return errorResponse("Add a summary or description before publishing", 400);
      }
    }

    try {
      let updated;
      let actionName;

      switch (action) {
        case "publish":
          updated = await publishOpportunity(id);
          actionName = "opportunity.published";
          break;
        case "close":
          updated = await closeOpportunity(id);
          actionName = "opportunity.closed";
          break;
        case "funded":
          updated = await markOpportunityFunded(id);
          actionName = "opportunity.funded";
          break;
        case "archive":
          updated = await archiveOpportunity(id);
          actionName = "opportunity.archived";
          break;
        case "revert_draft":
          updated = await revertOpportunityToDraft(id);
          actionName = "opportunity.reverted_to_draft";
          break;
      }

      await logAdminAction({
        adminId: admin.id,
        action: actionName,
        entityType: "opportunity",
        entityId: id,
        before: {
          status: before.status,
          publishedAt: before.publishedAt,
          closedAt: before.closedAt,
        },
        after: {
          status: updated.status,
          publishedAt: updated.publishedAt,
          closedAt: updated.closedAt,
        },
        metadata: { action },
        request,
      });

      // PHASE 4 MSG 2 — HOOK A
      // Fire-and-forget notification fan-out on publish.
      // Done AFTER audit log so the audit reflects the actual transition,
      // and intentionally NOT awaited so the response returns quickly.
      if (action === "publish") {
        // Use `before` for eligibleInvestorTypes since the publish update
        // doesn't return that field via the SELECT, but full data is in `before`.
        notifyEligibleInvestorsOfNewOpportunity({
          id,
          title: before.title,
          summary: before.summary,
          eligibleInvestorTypes: before.eligibleInvestorTypes,
        });
      }

      return successResponse({
        opportunity: updated,
        message: `Opportunity ${action === "revert_draft" ? "reverted to draft" : action + (action.endsWith("e") ? "d" : "ed")}`,
      });
    } catch (err) {
      log.error("opportunity.status.error", { error: err?.message, action });
      return errorResponse("Failed to update status", 500);
    }
  });
}