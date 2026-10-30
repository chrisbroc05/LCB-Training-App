-- AlterTable
ALTER TABLE "Lead" ADD COLUMN "marketingExcludedAt" TIMESTAMP(3),
ADD COLUMN "marketingExcludedReason" TEXT;
