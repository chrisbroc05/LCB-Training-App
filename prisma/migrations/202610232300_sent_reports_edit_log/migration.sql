-- CreateTable
CREATE TABLE "SwingAnalysisReportEditLog" (
    "id" TEXT NOT NULL,
    "submissionId" TEXT NOT NULL,
    "editedByAdminEmail" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SwingAnalysisReportEditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SwingAnalysisReportEditLog_submissionId_idx" ON "SwingAnalysisReportEditLog"("submissionId");

-- CreateIndex
CREATE INDEX "SwingAnalysisSubmission_status_respondedAt_idx" ON "SwingAnalysisSubmission"("status", "respondedAt");

-- AddForeignKey
ALTER TABLE "SwingAnalysisReportEditLog" ADD CONSTRAINT "SwingAnalysisReportEditLog_submissionId_fkey" FOREIGN KEY ("submissionId") REFERENCES "SwingAnalysisSubmission"("id") ON DELETE CASCADE ON UPDATE CASCADE;
