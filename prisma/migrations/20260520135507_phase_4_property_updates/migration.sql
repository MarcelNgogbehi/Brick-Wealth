-- AlterTable
ALTER TABLE "Spv" ADD COLUMN     "nominalValue" DECIMAL(10,2) NOT NULL DEFAULT 1.00;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "riskAcknowledgedAt" TIMESTAMP(3),
ADD COLUMN     "selfCertifiedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "spvId" TEXT NOT NULL,
    "unitsRequested" INTEGER NOT NULL,
    "unitPriceAtSub" DECIMAL(10,2) NOT NULL,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "selfCertifiedAtSubmit" BOOLEAN NOT NULL DEFAULT false,
    "riskAcknowledgedAtSubmit" BOOLEAN NOT NULL DEFAULT false,
    "suitabilityAnswers" JSONB,
    "paymentMethod" TEXT NOT NULL DEFAULT 'bank_transfer',
    "proofOfPaymentUrl" TEXT,
    "proofOfPaymentName" TEXT,
    "proofUploadedAt" TIMESTAMP(3),
    "rejectionReason" TEXT,
    "adminNotesInternal" TEXT,
    "reviewerAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "oversizedFlag" BOOLEAN NOT NULL DEFAULT false,
    "amlRequired" BOOLEAN NOT NULL DEFAULT false,
    "submittedAt" TIMESTAMP(3),
    "verifiedAt" TIMESTAMP(3),
    "fundedAt" TIMESTAMP(3),
    "fullyAllocatedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "subscriptionAgreementUrl" TEXT,
    "agreementGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Allocation" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "spvId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "unitsAllocated" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "amountReceived" DECIMAL(14,2) NOT NULL,
    "certificateNumber" TEXT,
    "certificateUrl" TEXT,
    "certificateGeneratedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "confirmedById" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,

    CONSTRAINT "Allocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Holding" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spvId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "totalInvested" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "ownershipPct" DOUBLE PRECISION NOT NULL,
    "firstInvestedAt" TIMESTAMP(3) NOT NULL,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Holding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CapTableSnapshot" (
    "id" TEXT NOT NULL,
    "spvId" TEXT NOT NULL,
    "snapshotDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "totalInvestors" INTEGER NOT NULL,
    "totalUnitsAllocated" INTEGER NOT NULL,
    "totalRaised" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "exportedByAdminId" TEXT NOT NULL,
    "exportFileUrl" TEXT,
    "holdingsJson" JSONB NOT NULL,

    CONSTRAINT "CapTableSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SubscriptionAuditEvent" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "beforeState" JSONB,
    "afterState" JSONB,
    "actorId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "visibleToInvestor" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SubscriptionAuditEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Subscription_userId_idx" ON "Subscription"("userId");

-- CreateIndex
CREATE INDEX "Subscription_opportunityId_idx" ON "Subscription"("opportunityId");

-- CreateIndex
CREATE INDEX "Subscription_spvId_idx" ON "Subscription"("spvId");

-- CreateIndex
CREATE INDEX "Subscription_status_idx" ON "Subscription"("status");

-- CreateIndex
CREATE INDEX "Subscription_submittedAt_idx" ON "Subscription"("submittedAt");

-- CreateIndex
CREATE INDEX "Subscription_reviewerAdminId_idx" ON "Subscription"("reviewerAdminId");

-- CreateIndex
CREATE INDEX "Subscription_userId_status_idx" ON "Subscription"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Allocation_certificateNumber_key" ON "Allocation"("certificateNumber");

-- CreateIndex
CREATE INDEX "Allocation_subscriptionId_idx" ON "Allocation"("subscriptionId");

-- CreateIndex
CREATE INDEX "Allocation_spvId_idx" ON "Allocation"("spvId");

-- CreateIndex
CREATE INDEX "Allocation_userId_idx" ON "Allocation"("userId");

-- CreateIndex
CREATE INDEX "Allocation_userId_spvId_idx" ON "Allocation"("userId", "spvId");

-- CreateIndex
CREATE INDEX "Allocation_certificateNumber_idx" ON "Allocation"("certificateNumber");

-- CreateIndex
CREATE INDEX "Allocation_status_idx" ON "Allocation"("status");

-- CreateIndex
CREATE INDEX "Holding_userId_idx" ON "Holding"("userId");

-- CreateIndex
CREATE INDEX "Holding_spvId_idx" ON "Holding"("spvId");

-- CreateIndex
CREATE UNIQUE INDEX "Holding_userId_spvId_key" ON "Holding"("userId", "spvId");

-- CreateIndex
CREATE INDEX "CapTableSnapshot_spvId_snapshotDate_idx" ON "CapTableSnapshot"("spvId", "snapshotDate");

-- CreateIndex
CREATE INDEX "CapTableSnapshot_exportedByAdminId_idx" ON "CapTableSnapshot"("exportedByAdminId");

-- CreateIndex
CREATE INDEX "SubscriptionAuditEvent_subscriptionId_createdAt_idx" ON "SubscriptionAuditEvent"("subscriptionId", "createdAt");

-- CreateIndex
CREATE INDEX "SubscriptionAuditEvent_actorId_idx" ON "SubscriptionAuditEvent"("actorId");

-- CreateIndex
CREATE INDEX "SubscriptionAuditEvent_eventType_idx" ON "SubscriptionAuditEvent"("eventType");

-- AddForeignKey
ALTER TABLE "Allocation" ADD CONSTRAINT "Allocation_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionAuditEvent" ADD CONSTRAINT "SubscriptionAuditEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
