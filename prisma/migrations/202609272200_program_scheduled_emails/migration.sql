-- CreateEnum
CREATE TYPE "ProgramEmailRecipient" AS ENUM ('player', 'parent', 'coach');

-- CreateEnum
CREATE TYPE "ProgramEmailType" AS ENUM ('DAILY_ROUTINE', 'DAY_BEFORE_START', 'SATURDAY_VIDEO_REMINDER', 'GONE_QUIET', 'PARENT_SATURDAY_VIDEO', 'PARENT_GONE_QUIET', 'PARENT_WEEKLY_RECAP', 'COACH_DAILY_SUMMARY');

-- AlterTable
ALTER TABLE "ProgramEnrollment" ADD COLUMN     "dailyRoutineEmailsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "parentName" TEXT,
ADD COLUMN     "parentEmail" TEXT,
ADD COLUMN     "parentEmailsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "parentPromptDismissedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "EmailLog" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "recipient" "ProgramEmailRecipient" NOT NULL,
    "type" "ProgramEmailType" NOT NULL,
    "dateKey" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EmailLog_dedupeKey_key" ON "EmailLog"("dedupeKey");

-- CreateIndex
CREATE UNIQUE INDEX "EmailLog_enrollmentId_recipient_type_dateKey_key" ON "EmailLog"("enrollmentId", "recipient", "type", "dateKey");

-- CreateIndex
CREATE INDEX "EmailLog_type_dateKey_idx" ON "EmailLog"("type", "dateKey");

-- AddForeignKey
ALTER TABLE "EmailLog" ADD CONSTRAINT "EmailLog_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
