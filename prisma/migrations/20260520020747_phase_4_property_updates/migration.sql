-- CreateTable
CREATE TABLE "PropertyUpdate" (
    "id" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "publishedAt" TIMESTAMP(3),
    "metadata" JSONB,
    "notifiedCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdateComment" (
    "id" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "parentCommentId" TEXT,
    "deletedAt" TIMESTAMP(3),
    "deletedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "deletionReason" TEXT,
    "isPinnedByAdmin" BOOLEAN NOT NULL DEFAULT false,
    "isFlagged" BOOLEAN NOT NULL DEFAULT false,
    "flagCount" INTEGER NOT NULL DEFAULT 0,
    "editedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UpdateComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdateReaction" (
    "id" TEXT NOT NULL,
    "updateId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpdateReaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpdateCommentFlag" (
    "id" TEXT NOT NULL,
    "commentId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UpdateCommentFlag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyUpdate_opportunityId_publishedAt_idx" ON "PropertyUpdate"("opportunityId", "publishedAt");

-- CreateIndex
CREATE INDEX "PropertyUpdate_opportunityId_deletedAt_idx" ON "PropertyUpdate"("opportunityId", "deletedAt");

-- CreateIndex
CREATE INDEX "PropertyUpdate_type_idx" ON "PropertyUpdate"("type");

-- CreateIndex
CREATE INDEX "PropertyUpdate_createdAt_idx" ON "PropertyUpdate"("createdAt");

-- CreateIndex
CREATE INDEX "UpdateComment_updateId_createdAt_idx" ON "UpdateComment"("updateId", "createdAt");

-- CreateIndex
CREATE INDEX "UpdateComment_updateId_deletedAt_idx" ON "UpdateComment"("updateId", "deletedAt");

-- CreateIndex
CREATE INDEX "UpdateComment_userId_idx" ON "UpdateComment"("userId");

-- CreateIndex
CREATE INDEX "UpdateComment_parentCommentId_idx" ON "UpdateComment"("parentCommentId");

-- CreateIndex
CREATE INDEX "UpdateComment_isFlagged_idx" ON "UpdateComment"("isFlagged");

-- CreateIndex
CREATE INDEX "UpdateReaction_updateId_type_idx" ON "UpdateReaction"("updateId", "type");

-- CreateIndex
CREATE INDEX "UpdateReaction_userId_idx" ON "UpdateReaction"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UpdateReaction_updateId_userId_type_key" ON "UpdateReaction"("updateId", "userId", "type");

-- CreateIndex
CREATE INDEX "UpdateCommentFlag_commentId_idx" ON "UpdateCommentFlag"("commentId");

-- CreateIndex
CREATE UNIQUE INDEX "UpdateCommentFlag_commentId_reporterId_key" ON "UpdateCommentFlag"("commentId", "reporterId");

-- AddForeignKey
ALTER TABLE "PropertyUpdate" ADD CONSTRAINT "PropertyUpdate_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdateComment" ADD CONSTRAINT "UpdateComment_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "PropertyUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpdateReaction" ADD CONSTRAINT "UpdateReaction_updateId_fkey" FOREIGN KEY ("updateId") REFERENCES "PropertyUpdate"("id") ON DELETE CASCADE ON UPDATE CASCADE;
