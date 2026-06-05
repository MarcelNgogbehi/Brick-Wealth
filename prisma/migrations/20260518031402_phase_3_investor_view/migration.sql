-- AlterTable
ALTER TABLE "Opportunity" ADD COLUMN     "exitStrategy" TEXT,
ADD COLUMN     "rentalStrategy" TEXT,
ADD COLUMN     "walkthroughVideoUrl" TEXT;

-- AlterTable
ALTER TABLE "Property" ADD COLUMN     "propertyValue" DECIMAL(14,2);

-- CreateTable
CREATE TABLE "OpportunityView" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OpportunityView_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentView" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OpportunityView_opportunityId_userId_idx" ON "OpportunityView"("opportunityId", "userId");

-- CreateIndex
CREATE INDEX "OpportunityView_userId_viewedAt_idx" ON "OpportunityView"("userId", "viewedAt");

-- CreateIndex
CREATE INDEX "OpportunityView_viewedAt_idx" ON "OpportunityView"("viewedAt");

-- CreateIndex
CREATE INDEX "DocumentView_documentId_userId_idx" ON "DocumentView"("documentId", "userId");

-- CreateIndex
CREATE INDEX "DocumentView_userId_opportunityId_idx" ON "DocumentView"("userId", "opportunityId");

-- CreateIndex
CREATE INDEX "DocumentView_viewedAt_idx" ON "DocumentView"("viewedAt");
