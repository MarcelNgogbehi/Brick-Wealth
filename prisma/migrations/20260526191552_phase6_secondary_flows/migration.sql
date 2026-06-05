-- AlterTable
ALTER TABLE "Allocation" ADD COLUMN     "supersededById" TEXT,
ADD COLUMN     "unitsTransferred" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "voidReason" TEXT,
ADD COLUMN     "voidedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ShareSaleRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "spvId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "unitsOffered" INTEGER NOT NULL,
    "indicativeUnitPrice" DECIMAL(12,2) NOT NULL,
    "indicativeAmount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "investorNote" TEXT,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "reviewerAdminId" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "adminNote" TEXT,
    "declineReason" TEXT,
    "buyerType" TEXT,
    "buyerUserId" TEXT,
    "buyerName" TEXT,
    "settledUnits" INTEGER,
    "settledUnitPrice" DECIMAL(12,2),
    "settledAmount" DECIMAL(14,2),
    "settledAt" TIMESTAMP(3),
    "titleTransferId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShareSaleRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TitleTransfer" (
    "id" TEXT NOT NULL,
    "spvId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "unitsTransferred" INTEGER NOT NULL,
    "unitPrice" DECIMAL(12,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "toType" TEXT NOT NULL,
    "toUserId" TEXT,
    "toName" TEXT,
    "voidedCertificateNumbers" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "newCertificateNumber" TEXT,
    "shareSaleRequestId" TEXT,
    "recordedByAdminId" TEXT NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TitleTransfer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ShareSaleRequest_userId_idx" ON "ShareSaleRequest"("userId");

-- CreateIndex
CREATE INDEX "ShareSaleRequest_spvId_idx" ON "ShareSaleRequest"("spvId");

-- CreateIndex
CREATE INDEX "ShareSaleRequest_status_idx" ON "ShareSaleRequest"("status");

-- CreateIndex
CREATE INDEX "ShareSaleRequest_opportunityId_idx" ON "ShareSaleRequest"("opportunityId");

-- CreateIndex
CREATE INDEX "TitleTransfer_spvId_idx" ON "TitleTransfer"("spvId");

-- CreateIndex
CREATE INDEX "TitleTransfer_fromUserId_idx" ON "TitleTransfer"("fromUserId");

-- CreateIndex
CREATE INDEX "TitleTransfer_toUserId_idx" ON "TitleTransfer"("toUserId");

-- CreateIndex
CREATE INDEX "TitleTransfer_opportunityId_idx" ON "TitleTransfer"("opportunityId");
