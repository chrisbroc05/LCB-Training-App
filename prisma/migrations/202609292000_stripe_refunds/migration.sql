-- AlterEnum
ALTER TYPE "ProgramEnrollmentStatus" ADD VALUE 'REFUNDED';

-- AlterEnum
ALTER TYPE "PushNotificationType" ADD VALUE 'COACH_REFUND_PROCESSED';

-- AlterTable
ALTER TABLE "ProgramEnrollment" ADD COLUMN     "refundedAt" TIMESTAMP(3),
ADD COLUMN     "refundAmountCents" INTEGER,
ADD COLUMN     "stripeRefundChargeId" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "membershipTierBeforeProgram" "MembershipTier",
ADD COLUMN     "marketingEmailsSuppressed" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "ProgramEnrollment_stripeRefundChargeId_key" ON "ProgramEnrollment"("stripeRefundChargeId");
