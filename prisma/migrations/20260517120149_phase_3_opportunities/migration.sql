-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "spvId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtitle" TEXT,
    "summary" TEXT,
    "fullDescription" TEXT,
    "riskWarning" TEXT,
    "targetYieldPct" DOUBLE PRECISION,
    "termMonths" INTEGER,
    "projectedReturnPct" DOUBLE PRECISION,
    "requiresKyc" BOOLEAN NOT NULL DEFAULT false,
    "eligibleInvestorTypes" TEXT[] DEFAULT ARRAY['retail', 'sophisticated', 'hnw']::TEXT[],
    "requiresSuitabilityCheck" BOOLEAN NOT NULL DEFAULT false,
    "suitabilityQuestions" JSONB,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "publishedAt" TIMESTAMP(3),
    "closedAt" TIMESTAMP(3),
    "openDate" TIMESTAMP(3),
    "closeDate" TIMESTAMP(3),
    "heroImageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpportunityDocument" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "category" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "storageType" TEXT NOT NULL DEFAULT 'uploadthing',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "uploadedById" TEXT,

    CONSTRAINT "OpportunityDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Opportunity_spvId_key" ON "Opportunity"("spvId");

-- CreateIndex
CREATE INDEX "Opportunity_status_idx" ON "Opportunity"("status");

-- CreateIndex
CREATE INDEX "Opportunity_spvId_idx" ON "Opportunity"("spvId");

-- CreateIndex
CREATE INDEX "Opportunity_publishedAt_idx" ON "Opportunity"("publishedAt");

-- CreateIndex
CREATE INDEX "Opportunity_openDate_closeDate_idx" ON "Opportunity"("openDate", "closeDate");

-- CreateIndex
CREATE INDEX "Opportunity_createdAt_idx" ON "Opportunity"("createdAt");

-- CreateIndex
CREATE INDEX "OpportunityDocument_opportunityId_sortOrder_idx" ON "OpportunityDocument"("opportunityId", "sortOrder");

-- CreateIndex
CREATE INDEX "OpportunityDocument_opportunityId_category_idx" ON "OpportunityDocument"("opportunityId", "category");

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_spvId_fkey" FOREIGN KEY ("spvId") REFERENCES "Spv"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OpportunityDocument" ADD CONSTRAINT "OpportunityDocument_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;
