// app/api/dashboard/subscriptions/route.js
//
// GET  /api/dashboard/subscriptions               — list mine
// POST /api/dashboard/subscriptions               — create new
//
// SECURITY:
// - dashboardRoute wrapping (session required)
// - CSRF on POST
// - Server-side eligibility re-check (never trust client)
// - Suitability + self-cert validated
//
// Phase 5 Msg 2 will add the SubscribeModal UI that calls this.

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  listSubscriptionsForInvestor,
  createSubscription,
  checkSubscriptionEligibility,
} from "@/lib/db";
import { isStripeConfigured } from "@/lib/stripe";

// ────────────────────────────────────────────────────────────────────
// GET — list my subscriptions
// ────────────────────────────────────────────────────────────────────
export async function GET(request) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const { searchParams } = new URL(request.url);

    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Math.min(50, parseInt(searchParams.get("pageSize") || "20", 10));

    const result = await listSubscriptionsForInvestor({
      userId: user.id,
      status,
      page,
      pageSize,
    });

    return NextResponse.json({ success: true, ...result });
  });
}

// ────────────────────────────────────────────────────────────────────
// POST — create subscription
// ────────────────────────────────────────────────────────────────────

const CreateSchema = z.object({
  opportunityId: z.string().min(1),
  unitsRequested: z.number().int().positive().max(1_000_000),
  selfCertifiedAtSubmit: z.literal(true, {
    errorMap: () => ({ message: "You must self-certify to proceed" }),
  }),
  riskAcknowledgedAtSubmit: z.literal(true, {
    errorMap: () => ({ message: "You must acknowledge the risks to proceed" }),
  }),
  suitabilityAnswers: z.record(z.unknown()).optional(),
}).strict();

export async function POST(request) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json(
        { success: false, message: "Invalid request" },
        { status: 403 }
      );
    }

    const user = await requireDashboardUser();

    let raw;
    try {
      raw = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid body" },
        { status: 400 }
      );
    }

    const parsed = CreateSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          message: parsed.error.issues[0]?.message || "Invalid input",
          fieldErrors: Object.fromEntries(
            parsed.error.issues.map((i) => [i.path.join("."), i.message])
          ),
        },
        { status: 400 }
      );
    }

    const {
      opportunityId,
      unitsRequested,
      suitabilityAnswers,
    } = parsed.data;

    // Eligibility pre-check (createSubscription re-checks, but this gives
    // a friendlier error response with structured reasons)
    const eligibility = await checkSubscriptionEligibility({
      userId: user.id,
      opportunityId,
    });
    if (!eligibility.eligible) {
      return NextResponse.json(
        {
          success: false,
          message: friendlyEligibilityMessage(eligibility.reasons),
          reasons: eligibility.reasons,
        },
        { status: 403 }
      );
    }

    try {
      const subscription = await createSubscription({
        userId: user.id,
        opportunityId,
        unitsRequested,
        selfCertifiedAtSubmit: true,
        riskAcknowledgedAtSubmit: true,
        suitabilityAnswers: suitabilityAnswers || null,
      });

      // Phase 5 Msg 4 will wire notifications here.
      // For now: subscription is created silently, admin will see it
      // in the queue (Phase 5 Msg 3) and process manually.

      return NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          unitsRequested: subscription.unitsRequested,
          totalAmount: subscription.totalAmount?.toString(),
          currency: subscription.currency,
          submittedAt: subscription.submittedAt,
        },
        cardPaymentsEnabled: isStripeConfigured(),
        message: "Subscription submitted successfully",
      });
    } catch (err) {
      const msg = err?.message || "Failed to create subscription";
      console.error("[subscriptions.create]", msg);
      return NextResponse.json(
        { success: false, message: msg },
        { status: 400 }
      );
    }
  });
}

// ────────────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────────────

function friendlyEligibilityMessage(reasons) {
  if (reasons.includes("account_suspended")) {
    return "Your account is suspended. Please contact support.";
  }
  if (reasons.includes("account_not_activated")) {
    return "Please complete onboarding before subscribing.";
  }
  if (reasons.includes("kyc_not_approved")) {
    return "Your KYC must be approved before you can subscribe.";
  }
  if (reasons.includes("consents_incomplete")) {
    return "Please accept the legal terms before subscribing.";
  }
  if (reasons.includes("opportunity_not_live")) {
    return "This opportunity is not currently open for subscription.";
  }
  if (reasons.includes("opportunity_closed")) {
    return "This opportunity has closed.";
  }
  if (reasons.includes("investor_type_ineligible")) {
    return "You're not eligible for this opportunity based on your investor type.";
  }
  if (reasons.includes("already_active_subscription")) {
    return "You already have an active subscription for this opportunity.";
  }
  if (reasons.includes("fully_subscribed")) {
    return "This opportunity is fully subscribed.";
  }
  return "You're not eligible to subscribe to this opportunity right now.";
}