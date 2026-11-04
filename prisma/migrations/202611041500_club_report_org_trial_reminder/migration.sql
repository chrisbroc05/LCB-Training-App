-- AlterEnum
ALTER TYPE "MarketingEmailType" ADD VALUE 'ORG_TRIAL_SUBMISSION_REMINDER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "clubReportExcluded" BOOLEAN NOT NULL DEFAULT false;
