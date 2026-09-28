-- AlterTable
ALTER TABLE "MentalGameSubmission" ADD COLUMN "whereWasThis" TEXT,
ADD COLUMN "lookAtFocus" TEXT;

-- AlterTable
ALTER TABLE "SwingAnalysisSubmission" ADD COLUMN "whereWasThis" TEXT,
ADD COLUMN "lookAtFocus" TEXT,
ADD COLUMN "videoCategory" TEXT;
