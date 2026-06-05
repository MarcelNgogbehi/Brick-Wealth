// app/api/dashboard/opportunities/[id]/top-up/route.js
//
// GET  /api/dashboard/opportunities/[id]/top-up  — context for the Buy More modal
// POST /api/dashboard/opportunities/[id]/top-up  — create a top-up subscription
//
// A top-up is a normal Subscription against an opportunity the investor
// already holds. It flows through the same verify → fund → allocate
// pipeline and produces its own certificate.

import { z } from "zod";
import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import {
  getTopUpContext,
  createTopUpSubscription,
} from "@/lib/db";
import {
  notifySubscriptionReceived,
  notifyAdminOfNewSubscription,
} from "@/lib/notify";

// ────────────────────────────────────────────────────────────────────
// GET — context
// ────────────────────────────────────────────────────────────────────
export async function GET(request, { params }) {
  return dashboardRoute(async () => {
    const user = await requireDashboardUser();
    const { id } = await params;

    const ctx = await getTopUpContext({ userId: user.id, opportunityId: id });
    if (!ctx) {
      return NextResponse.json(
        { success: false, message: "Opportunity not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, ...ctx });
  });
}

// ────────────────────────────────────────────────────────────────────
// POST — create top-up subscription
// ────────────────────────────────────────────────────────────────────
const Schema = z.object({
  unitsRequested: z.number().int().positive(),
  selfCertified: z.literal(true),
  riskAcknowledged: z.literal(true),
  suitabilityAnswers: z.record(z.any()).optional(),
}).strict();

export async function POST(request, { params }) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }

    const user = await requireDashboardUser();
    const { id } = await params;

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
      const now = new Date();
      const subscription = await createTopUpSubscription({
        userId: user.id,
        opportunityId: id,
        unitsRequested: parsed.data.unitsRequested,
        selfCertifiedAtSubmit: now,
        riskAcknowledgedAtSubmit: now,
        suitabilityAnswers: parsed.data.suitabilityAnswers,
      });

      // Notifications — same as a first subscription
      const ctx = await getTopUpContext({ userId: user.id, opportunityId: id }).catch(() => null);
      const opportunityTitle = ctx?.opportunity?.title || "your investment";
      const currencySymbol =
        subscription.currency === "USD" ? "$" : subscription.currency === "EUR" ? "€" : "£";

      notifySubscriptionReceived({
        userId: user.id,
        opportunityTitle,
        subscriptionId: subscription.id,
        currencySymbol,
        totalAmount: subscription.totalAmount?.toString(),
      });

      notifyAdminOfNewSubscription({
        investorName: user.fullName,
        opportunityTitle,
        subscriptionId: subscription.id,
        currencySymbol,
        totalAmount: subscription.totalAmount?.toString(),
        oversized: subscription.oversizedFlag,
      });

      return NextResponse.json({
        success: true,
        subscription: {
          id: subscription.id,
          status: subscription.status,
          unitsRequested: subscription.unitsRequested,
          totalAmount: subscription.totalAmount?.toString(),
        },
        message: "Top-up subscription submitted",
      });
    } catch (err) {
      const msg = err?.message || "Top-up failed";
      return NextResponse.json({ success: false, message: msg }, { status: 400 });
    }
  });
}