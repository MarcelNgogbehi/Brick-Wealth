-- AlterTable: add optional Stripe card-payment fields to Subscription
ALTER TABLE "Subscription" ADD COLUMN     "stripeCheckoutSessionId" TEXT,
ADD COLUMN     "stripePaymentIntentId" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3);

-- CreateIndex: one Stripe Checkout session maps to at most one subscription
CREATE UNIQUE INDEX "Subscription_stripeCheckoutSessionId_key" ON "Subscription"("stripeCheckoutSessionId");
