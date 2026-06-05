-- DropTable
DROP TABLE "playing_with_neon";

-- CreateTable
CREATE TABLE "Property" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "addressLine1" TEXT NOT NULL,
    "addressLine2" TEXT,
    "city" TEXT NOT NULL,
    "region" TEXT,
    "postcode" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'GB',
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "propertyType" TEXT NOT NULL,
    "bedrooms" INTEGER,
    "bathrooms" INTEGER,
    "sqft" INTEGER,
    "yearBuilt" INTEGER,
    "description" TEXT,
    "story" TEXT,
    "neighbourhoodHighlights" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropertyImage" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "caption" TEXT,
    "altText" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isHero" BOOLEAN NOT NULL DEFAULT false,
    "storageType" TEXT NOT NULL DEFAULT 'uploadthing',
    "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropertyImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Spv" (
    "id" TEXT NOT NULL,
    "spvName" TEXT NOT NULL,
    "companyNumber" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL DEFAULT 'UK',
    "incorporatedOn" TIMESTAMP(3),
    "registeredAddress" TEXT,
    "purpose" TEXT,
    "propertyId" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "targetRaiseAmount" DECIMAL(14,2) NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "totalUnits" INTEGER NOT NULL,
    "unitsAllocated" INTEGER NOT NULL DEFAULT 0,
    "minimumUnits" INTEGER NOT NULL DEFAULT 1,
    "openDate" TIMESTAMP(3),
    "closeDate" TIMESTAMP(3),
    "bankAccountReference" TEXT,
    "bankAccountName" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "Spv_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Mortgage" (
    "id" TEXT NOT NULL,
    "spvId" TEXT NOT NULL,
    "lenderName" TEXT NOT NULL,
    "mortgageType" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "principalAmount" DECIMAL(14,2) NOT NULL,
    "ltvPct" DOUBLE PRECISION NOT NULL,
    "interestRate" DOUBLE PRECISION NOT NULL,
    "termMonths" INTEGER NOT NULL,
    "monthlyPaymentEst" DECIMAL(12,2),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "covenantsNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Mortgage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Property_status_idx" ON "Property"("status");

-- CreateIndex
CREATE INDEX "Property_city_idx" ON "Property"("city");

-- CreateIndex
CREATE INDEX "Property_country_idx" ON "Property"("country");

-- CreateIndex
CREATE INDEX "Property_propertyType_idx" ON "Property"("propertyType");

-- CreateIndex
CREATE INDEX "Property_createdAt_idx" ON "Property"("createdAt");

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_sortOrder_idx" ON "PropertyImage"("propertyId", "sortOrder");

-- CreateIndex
CREATE INDEX "PropertyImage_propertyId_isHero_idx" ON "PropertyImage"("propertyId", "isHero");

-- CreateIndex
CREATE UNIQUE INDEX "Spv_companyNumber_key" ON "Spv"("companyNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Spv_propertyId_key" ON "Spv"("propertyId");

-- CreateIndex
CREATE INDEX "Spv_status_idx" ON "Spv"("status");

-- CreateIndex
CREATE INDEX "Spv_companyNumber_idx" ON "Spv"("companyNumber");

-- CreateIndex
CREATE INDEX "Spv_currency_idx" ON "Spv"("currency");

-- CreateIndex
CREATE INDEX "Spv_createdAt_idx" ON "Spv"("createdAt");

-- CreateIndex
CREATE INDEX "Spv_openDate_closeDate_idx" ON "Spv"("openDate", "closeDate");

-- CreateIndex
CREATE UNIQUE INDEX "Mortgage_spvId_key" ON "Mortgage"("spvId");

-- AddForeignKey
ALTER TABLE "PropertyImage" ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Spv" ADD CONSTRAINT "Spv_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Mortgage" ADD CONSTRAINT "Mortgage_spvId_fkey" FOREIGN KEY ("spvId") REFERENCES "Spv"("id") ON DELETE CASCADE ON UPDATE CASCADE;
