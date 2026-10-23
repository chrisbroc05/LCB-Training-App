-- AlterTable
ALTER TABLE "SwingAnalysisSubmission" ADD COLUMN "submittedVideoPosterR2Key" TEXT,
ADD COLUMN "responseVideoPosterR2Key" TEXT;

-- AlterTable
ALTER TABLE "MentalGameSubmission" ADD COLUMN "submittedVideoPosterR2Key" TEXT,
ADD COLUMN "responseVideoPosterR2Key" TEXT;

-- AlterTable
ALTER TABLE "CoachVideo" ADD COLUMN "posterR2Key" TEXT;
