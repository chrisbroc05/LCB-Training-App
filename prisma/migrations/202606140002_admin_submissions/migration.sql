-- AlterTable
ALTER TABLE "MentalGameSubmission"
ADD COLUMN "responseText" TEXT,
ADD COLUMN "responseVideoUrl" TEXT,
ADD COLUMN "respondedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SwingAnalysisSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "pitchType" TEXT NOT NULL,
    "handedness" TEXT NOT NULL,
    "notes" TEXT NOT NULL,
    "submittedVideo" TEXT NOT NULL,
    "responsePreference" "MentalGameResponsePreference" NOT NULL,
    "status" "MentalGameSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "responseText" TEXT,
    "responseVideoUrl" TEXT,
    "respondedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SwingAnalysisSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SwingAnalysisSubmission_userId_idx" ON "SwingAnalysisSubmission"("userId");

-- AddForeignKey
ALTER TABLE "SwingAnalysisSubmission" ADD CONSTRAINT "SwingAnalysisSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
