-- AlterTable
ALTER TABLE "SwingAnalysisSubmission" ADD COLUMN     "reportStrengths" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "reportAreasToImprove" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "reportRecommendedDrillLines" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "reportNoteFromCoach" TEXT,
ADD COLUMN     "reportLibraryDrillIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "evaluationPdfR2Key" TEXT;

-- CreateTable
CREATE TABLE "UserFixItGrant" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "resourceSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdByAdminEmail" TEXT NOT NULL,

    CONSTRAINT "UserFixItGrant_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserFixItGrant_userId_idx" ON "UserFixItGrant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFixItGrant_userId_resourceSlug_key" ON "UserFixItGrant"("userId", "resourceSlug");

-- AddForeignKey
ALTER TABLE "UserFixItGrant" ADD CONSTRAINT "UserFixItGrant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
