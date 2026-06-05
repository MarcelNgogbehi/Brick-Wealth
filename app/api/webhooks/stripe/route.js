// app/api/webhooks/stripe/route.js
//
// POST /api/webhooks/stripe
//
// Stripe's trusted callback. When a Checkout payment completes, Stripe POSTs
// the event here. We verify the signature, then record `paidAt` on the matching
// subscription (idempotently). This is the SOURCE OF TRUTH that a card payment
// cleared — never trust the browser success redirect for that.
//
// This route is intentionally PUBLIC (no session/CSRF): it is authenticated by
// the Stripe signature header instead. Configure the endpoint + signing secret
// in your Stripe Dashboard and set STRIPE_WEBHOOK_SECRET.

import { NextResponse } from "next/server";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { recordSubscriptionStripePayment } from "@/lib/db";
import { env } from "@/lib/env";

export const runtime = "nodejs";
// Never cache; always run on the server for every event.
export const dynamic = "force-dynamic";

export async function POST(request) {
  if (!isStripeConfigured() || !env.STRIPE_WEBHOOK_SECRET) {
    // Misconfigured — acknowledge so Stripe doesn't hammer retries, but log.
    console.error("[stripe.webhook] received event but Stripe is not configured");
    return NextResponse.json({ received: true });
  }

  const stripe = getStripe();
  const sig = request.headers.get("stripe-signature");
  const rawBody = await request.text(); // raw body required for signature check

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("[stripe.webhook] signature verification failed:", err?.message);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      // Only act on actually-paid sessions.
      if (session.payment_status === "paid" || session.status === "complete") {
        const subscriptionId = session.metadata?.subscriptionId;
        if (subscriptionId) {
          await recordSubscriptionStripePayment({
            subscriptionId,
            sessionId: session.id,
            paymentIntentId:
              typeof session.payment_intent === "string"
                ? session.payment_intent
                : session.payment_intent?.id || null,
          });
        }
      }
    }
    // Other event types are acknowledged and ignored.
  } catch (err) {
    console.error("[stripe.webhook] handler error:", err?.message || err);
    // 500 tells Stripe to retry — safe because recording is idempotent.
    return NextResponse.json({ error: "Handler error" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
