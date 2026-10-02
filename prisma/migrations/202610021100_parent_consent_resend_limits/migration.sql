-- AlterTable
ALTER TABLE "User" ADD COLUMN "parentConsentManualResendDayKey" TEXT;
ALTER TABLE "User" ADD COLUMN "parentConsentManualResendCount" INTEGER NOT NULL DEFAULT 0;
