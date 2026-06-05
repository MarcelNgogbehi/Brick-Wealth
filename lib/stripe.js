// lib/stripe.js
//
// Stripe server client (singleton). Only imported by server code
// (the /pay route and the webhook). Never import this in a client component.
//
// If STRIPE_SECRET_KEY is not set, getStripe() returns null so callers can
// degrade gracefully (card payments simply unavailable) instead of crashing.

import Stripe from "stripe";
import { env } from "@/lib/env";

const globalForStripe = globalThis;

export function isStripeConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  if (!env.STRIPE_SECRET_KEY) return null;
  if (!globalForStripe.stripe) {
    globalForStripe.stripe = new Stripe(env.STRIPE_SECRET_KEY, {
      apiVersion: "2024-06-20",
      appInfo: { name: "Bricks & Wealth" },
    });
  }
  return globalForStripe.stripe;
}

// Stripe wants the smallest currency unit (pence/cents) as an integer.
export function toMinorUnits(amount) {
  return Math.round(Number(amount) * 100);
}
