-- CreateTable
CREATE TABLE "Distribution" (
    "id" TEXT NOT NULL,
    "spvId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "declarationLabel" TEXT NOT NULL,
    "description" TEXT,
    "totalAmount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "amountPerUnit" DECIMAL(12,6) NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "taxYearUk" TEXT NOT NULL,
    "taxYearCalendar" TEXT NOT NULL,
    "withholdingPct" DOUBLE PRECISION,
    "withholdingNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "bankReference" TEXT,
    "recordedByAdminId" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "holdersAtRecord" INTEGER NOT NULL DEFAULT 0,
    "totalUnitsAtRecord" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Distribution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DistributionAllocation" (
    "id" TEXT NOT NULL,
    "distributionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spvId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "holdingId" TEXT,
    "unitsHeld" INTEGER NOT NULL,
    "ownershipPctAtRecord" DOUBLE PRECISION NOT NULL,
    "grossAmount" DECIMAL(14,2) NOT NULL,
    "withholdingAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "netAmount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "taxYearUk" TEXT NOT NULL,
    "taxYearCalendar" TEXT NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RECORDED',
    "paidAt" TIMESTAMP(3),
    "paymentReference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DistributionAllocation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Distribution_spvId_idx" ON "Distribution"("spvId");

-- CreateIndex
CREATE INDEX "Distribution_opportunityId_idx" ON "Distribution"("opportunityId");

-- CreateIndex
CREATE INDEX "Distribution_status_idx" ON "Distribution"("status");

-- CreateIndex
CREATE INDEX "Distribution_recordDate_idx" ON "Distribution"("recordDate");

-- CreateIndex
CREATE INDEX "Distribution_paymentDate_idx" ON "Distribution"("paymentDate");

-- CreateIndex
CREATE INDEX "Distribution_taxYearUk_idx" ON "Distribution"("taxYearUk");

-- CreateIndex
CREATE INDEX "Distribution_taxYearCalendar_idx" ON "Distribution"("taxYearCalendar");

-- CreateIndex
CREATE INDEX "DistributionAllocation_userId_idx" ON "DistributionAllocation"("userId");

-- CreateIndex
CREATE INDEX "DistributionAllocation_spvId_idx" ON "DistributionAllocation"("spvId");

-- CreateIndex
CREATE INDEX "DistributionAllocation_opportunityId_idx" ON "DistributionAllocation"("opportunityId");

-- CreateIndex
CREATE INDEX "DistributionAllocation_userId_taxYearUk_idx" ON "DistributionAllocation"("userId", "taxYearUk");

-- CreateIndex
CREATE INDEX "DistributionAllocation_userId_taxYearCalendar_idx" ON "DistributionAllocation"("userId", "taxYearCalendar");

-- CreateIndex
CREATE INDEX "DistributionAllocation_status_idx" ON "DistributionAllocation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DistributionAllocation_distributionId_userId_key" ON "DistributionAllocation"("distributionId", "userId");

-- AddForeignKey
ALTER TABLE "DistributionAllocation" ADD CONSTRAINT "DistributionAllocation_distributionId_fkey" FOREIGN KEY ("distributionId") REFERENCES "Distribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;
