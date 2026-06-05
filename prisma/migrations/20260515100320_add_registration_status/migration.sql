-- AlterTable
ALTER TABLE "User" ADD COLUMN     "registrationStatus" TEXT NOT NULL DEFAULT 'pending';

-- CreateIndex
CREATE INDEX "User_registrationStatus_idx" ON "User"("registrationStatus");
