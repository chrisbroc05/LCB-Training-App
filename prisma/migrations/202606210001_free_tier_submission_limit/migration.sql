-- Add FREE as a membership tier
ALTER TYPE "MembershipTier" ADD VALUE IF NOT EXISTS 'FREE';

-- Add shared free submission tracker
ALTER TABLE "User"
ADD COLUMN "freeSubmissionUsed" BOOLEAN NOT NULL DEFAULT false;

-- New signups default to FREE
ALTER TABLE "User" ALTER COLUMN "membershipTier" SET DEFAULT 'FREE';
