// app/api/dashboard/subscriptions/[id]/pay/route.js
//
// POST /api/dashboard/subscriptions/[id]/pay
//
// Creates a Stripe Checkout Session for this subscription's total amount and
// returns its hosted URL. The client redirects the investor to Stripe to pay
// by card. When the payment clears, Stripe calls our webhook
// (/api/webhooks/stripe) which records `paidAt` on the subscription.
//
// This is a payment RAIL only — after paying, the investor still uploads a
// receipt at the proof-of-payment step and the admin still verifies/funds.
//
// SECURITY: session required (dashboardRoute), CSRF on POST, ownership enforced.

import { NextResponse } from "next/server";
import { verifyCsrf } from "@/lib/auth";
import { requireDashboardUser, dashboardRoute } from "@/lib/dashboard-auth";
import { getSubscriptionForCheckout } from "@/lib/db";
import { getStripe, isStripeConfigured, toMinorUnits } from "@/lib/stripe";
import { env } from "@/lib/env";

export const runtime = "nodejs";

// States where paying still makes sense (before the admin marks it funded).
const PAYABLE_STATES = new Set(["SUBMITTED", "UNDER_REVIEW", "VERIFIED"]);

export async function POST(request, { params }) {
  return dashboardRoute(async () => {
    if (!verifyCsrf(request)) {
      return NextResponse.json({ success: false, message: "Invalid request" }, { status: 403 });
    }

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { success: false, message: "Card payments are not enabled. Please pay by bank transfer." },
        { status: 503 }
      );
    }

    const user = await requireDashboardUser();
    const { id } = await params;

    const sub = await getSubscriptionForCheckout({ subscriptionId: id, userId: user.id });
    if (!sub) {
      return NextResponse.json({ success: false, message: "Subscription not found" }, { status: 404 });
    }
    if (sub.paidAt) {
      return NextResponse.json({ success: false, message: "This subscription is already paid." }, { status: 409 });
    }
    if (!PAYABLE_STATES.has(sub.status)) {
      return NextResponse.json({ success: false, message: "This subscription can no longer be paid online." }, { status: 409 });
    }

    const amount = toMinorUnits(sub.totalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ success: false, message: "Invalid payment amount." }, { status: 400 });
    }

    const currency = (sub.currency || "GBP").toLowerCase();
    const oppTitle = sub.opportunity?.title || "Investment subscription";
    const base = env.APP_URL?.replace(/\/$/, "") || "";

    try {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        // Pre-fill the investor's email on the Stripe page.
        customer_email: user.email || undefined,
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency,
              unit_amount: amount,
              product_data: {
                name: oppTitle,
                description: `${sub.unitsRequested} unit${sub.unitsRequested === 1 ? "" : "s"} · subscription ${sub.id}`,
              },
            },
          },
        ],
        // Metadata is echoed back on the webhook — our source of truth for
        // which subscription this payment belongs to.
        metadata: { subscriptionId: sub.id, userId: user.id },
        payment_intent_data: {
          metadata: { subscriptionId: sub.id, userId: user.id },
        },
        success_url: `${base}/dashboard/subscriptions/${sub.id}?paid=1`,
        cancel_url: `${base}/dashboard/subscriptions/${sub.id}?canceled=1`,
      });

      return NextResponse.json({ success: true, url: session.url });
    } catch (err) {
      console.error("[subscriptions.pay] stripe error:", err?.message || err);
      return NextResponse.json(
        { success: false, message: "Could not start card payment. Please try again." },
        { status: 502 }
      );
    }
  });
}
