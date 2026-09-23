-- AlterEnum
ALTER TYPE "MembershipTier" ADD VALUE 'TWELVE_WEEK';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "twelveWeekProgramStartedAt" TIMESTAMP(3),
ADD COLUMN "twelveWeekProgramEndsAt" TIMESTAMP(3);
