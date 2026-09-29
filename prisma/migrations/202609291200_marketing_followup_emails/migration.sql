-- CreateEnum
CREATE TYPE "MarketingEmailType" AS ENUM (
  'WELCOME',
  'FREE_SUBMISSION_REMINDER',
  'FOLLOWUP_DRILLS_DAY_2',
  'FOLLOWUP_OTHER_SIX_DAY_4',
  'FOLLOWUP_SAMPLE_DAY_DAY_7',
  'FOLLOWUP_KNOWN_FOR_DAY_10'
);

-- CreateTable
CREATE TABLE "MarketingEmailLog" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "MarketingEmailType" NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "anchorSubmissionId" TEXT,
  "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MarketingEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MarketingEmailLog_dedupeKey_key" ON "MarketingEmailLog"("dedupeKey");

-- CreateIndex
CREATE INDEX "MarketingEmailLog_userId_type_idx" ON "MarketingEmailLog"("userId", "type");

-- AddForeignKey
ALTER TABLE "MarketingEmailLog" ADD CONSTRAINT "MarketingEmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
