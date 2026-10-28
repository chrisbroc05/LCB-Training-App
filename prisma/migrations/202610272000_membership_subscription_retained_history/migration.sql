-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'EXPIRED';

-- AlterTable
ALTER TABLE "MembershipSubscription" ADD COLUMN "accessEndedAt" TIMESTAMP(3);
