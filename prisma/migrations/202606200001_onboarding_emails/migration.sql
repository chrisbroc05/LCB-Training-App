-- AlterTable
ALTER TABLE "User"
ADD COLUMN "signupDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN "onboardingEmail1Sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "onboardingEmail2Sent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "onboardingEmail3Sent" BOOLEAN NOT NULL DEFAULT false;

-- Backfill signup date from existing account creation timestamp
UPDATE "User"
SET "signupDate" = "createdAt";
