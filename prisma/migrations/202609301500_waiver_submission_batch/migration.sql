-- AlterTable
ALTER TABLE "WaiverSignature" ADD COLUMN "submissionBatchId" TEXT;

-- CreateIndex
CREATE INDEX "WaiverSignature_submissionBatchId_idx" ON "WaiverSignature"("submissionBatchId");
