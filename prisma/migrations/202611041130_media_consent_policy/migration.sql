-- AlterTable
ALTER TABLE "User" ADD COLUMN "mediaOptOutAll" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "WaiverSignature" ADD COLUMN "mediaOptOutAll" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "MediaPolicyUpdateEmailLog" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MediaPolicyUpdateEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MediaPolicyUpdateEmailLog_dedupeKey_key" ON "MediaPolicyUpdateEmailLog"("dedupeKey");

-- CreateIndex
CREATE INDEX "MediaPolicyUpdateEmailLog_email_idx" ON "MediaPolicyUpdateEmailLog"("email");
