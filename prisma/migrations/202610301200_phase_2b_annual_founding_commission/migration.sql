-- CreateEnum
CREATE TYPE "MembershipBillingInterval" AS ENUM ('MONTHLY', 'ANNUAL');
CREATE TYPE "MembershipEmailType" AS ENUM ('ANNUAL_RENEWAL_REMINDER', 'COMMISSION_MONTHLY_REPORT');

-- AlterEnum
ALTER TYPE "CoachingReviewTrack" ADD VALUE 'EXTRA_REVIEW';

-- AlterTable Organization
ALTER TABLE "Organization" ADD COLUMN "ongoingCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.05;
ALTER TABLE "Organization" ADD COLUMN "commissionEndsAt" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "foundingOfferEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Organization" ADD COLUMN "foundingOfferDeadline" TIMESTAMP(3);
ALTER TABLE "Organization" ADD COLUMN "foundingOfferMonths" INTEGER NOT NULL DEFAULT 12;
ALTER TABLE "Organization" ALTER COLUMN "commissionRate" SET DEFAULT 0.15;
ALTER TABLE "Organization" ALTER COLUMN "commissionMonths" SET DEFAULT 12;

-- AlterTable User
ALTER TABLE "User" ADD COLUMN "commissionAttributionOrgId" TEXT;
ALTER TABLE "User" ADD COLUMN "commissionAttributionJoinedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "commissionEligible" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ADD COLUMN "commissionIneligibleReason" TEXT;
ALTER TABLE "User" ADD COLUMN "commissionEligibleAdminOverride" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable MembershipSubscription
ALTER TABLE "MembershipSubscription" ADD COLUMN "billingInterval" "MembershipBillingInterval" NOT NULL DEFAULT 'MONTHLY';
ALTER TABLE "MembershipSubscription" ADD COLUMN "pendingBillingInterval" "MembershipBillingInterval";
ALTER TABLE "MembershipSubscription" ADD COLUMN "foundingDiscountEndsAt" TIMESTAMP(3);

-- AlterTable MembershipSubscriptionPayment
ALTER TABLE "MembershipSubscriptionPayment" ADD COLUMN "billingInterval" "MembershipBillingInterval";
ALTER TABLE "MembershipSubscriptionPayment" ADD COLUMN "annualRefundEligibleUntil" TIMESTAMP(3);
ALTER TABLE "MembershipSubscriptionPayment" ADD COLUMN "refundedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ExtraReviewCredit" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "purchasedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "stripeCheckoutSessionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ExtraReviewCredit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrgCommissionLedgerEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeInvoiceId" TEXT,
    "level" "MembershipLevel",
    "billingInterval" "MembershipBillingInterval",
    "paymentCents" INTEGER NOT NULL,
    "commissionRate" DOUBLE PRECISION NOT NULL,
    "commissionCents" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "isRefund" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrgCommissionLedgerEntry_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrgCommissionPayout" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "monthKey" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "method" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrgCommissionPayout_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrgCommissionCarryBalance" (
    "organizationId" TEXT NOT NULL,
    "amountCents" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OrgCommissionCarryBalance_pkey" PRIMARY KEY ("organizationId")
);

CREATE TABLE "MembershipEmailLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "MembershipEmailType" NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MembershipEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtraReviewCredit_stripeCheckoutSessionId_key" ON "ExtraReviewCredit"("stripeCheckoutSessionId");
CREATE INDEX "ExtraReviewCredit_userId_usedAt_idx" ON "ExtraReviewCredit"("userId", "usedAt");
CREATE INDEX "ExtraReviewCredit_userId_expiresAt_idx" ON "ExtraReviewCredit"("userId", "expiresAt");
CREATE INDEX "OrgCommissionLedgerEntry_organizationId_paidAt_idx" ON "OrgCommissionLedgerEntry"("organizationId", "paidAt" DESC);
CREATE INDEX "OrgCommissionLedgerEntry_userId_paidAt_idx" ON "OrgCommissionLedgerEntry"("userId", "paidAt" DESC);
CREATE UNIQUE INDEX "OrgCommissionPayout_organizationId_monthKey_key" ON "OrgCommissionPayout"("organizationId", "monthKey");
CREATE UNIQUE INDEX "MembershipEmailLog_dedupeKey_key" ON "MembershipEmailLog"("dedupeKey");
CREATE INDEX "MembershipEmailLog_userId_type_idx" ON "MembershipEmailLog"("userId", "type");
CREATE INDEX "User_commissionAttributionOrgId_idx" ON "User"("commissionAttributionOrgId");

-- AddForeignKey
ALTER TABLE "ExtraReviewCredit" ADD CONSTRAINT "ExtraReviewCredit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrgCommissionLedgerEntry" ADD CONSTRAINT "OrgCommissionLedgerEntry_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrgCommissionLedgerEntry" ADD CONSTRAINT "OrgCommissionLedgerEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrgCommissionPayout" ADD CONSTRAINT "OrgCommissionPayout_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrgCommissionCarryBalance" ADD CONSTRAINT "OrgCommissionCarryBalance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MembershipEmailLog" ADD CONSTRAINT "MembershipEmailLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
