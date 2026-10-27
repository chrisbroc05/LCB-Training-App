-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE 'PAST_DUE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "pendingCheckoutLevel" "MembershipLevel";

-- CreateTable
CREATE TABLE "MembershipSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "stripeCustomerId" TEXT NOT NULL,
    "stripeSubscriptionId" TEXT NOT NULL,
    "stripePriceId" TEXT,
    "stripeScheduleId" TEXT,
    "level" "MembershipLevel" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL,
    "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "pendingLevel" "MembershipLevel",
    "startedAt" TIMESTAMP(3) NOT NULL,
    "organizationId" TEXT,
    "orgJoinedAtSnapshot" TIMESTAMP(3),
    "pastDueGraceEndsAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MembershipSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MembershipSubscriptionPayment" (
    "id" TEXT NOT NULL,
    "stripeInvoiceId" TEXT NOT NULL,
    "membershipSubscriptionId" TEXT,
    "userId" TEXT,
    "level" "MembershipLevel",
    "amountCents" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'usd',
    "paidAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MembershipSubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeWebhookEvent" (
    "stripeEventId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StripeWebhookEvent_pkey" PRIMARY KEY ("stripeEventId")
);

-- CreateTable
CREATE TABLE "AllAccessWaitlistEntry" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "note" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AllAccessWaitlistEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlatformCoachingSettings" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "allAccessProgramCap" INTEGER NOT NULL DEFAULT 25,

    CONSTRAINT "PlatformCoachingSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PlatformCoachingSettings" ("id", "allAccessProgramCap") VALUES ('default', 25);

-- CreateIndex
CREATE UNIQUE INDEX "MembershipSubscription_userId_key" ON "MembershipSubscription"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipSubscription_stripeSubscriptionId_key" ON "MembershipSubscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "MembershipSubscription_organizationId_idx" ON "MembershipSubscription"("organizationId");

-- CreateIndex
CREATE INDEX "MembershipSubscription_status_level_idx" ON "MembershipSubscription"("status", "level");

-- CreateIndex
CREATE UNIQUE INDEX "MembershipSubscriptionPayment_stripeInvoiceId_key" ON "MembershipSubscriptionPayment"("stripeInvoiceId");

-- CreateIndex
CREATE INDEX "MembershipSubscriptionPayment_userId_paidAt_idx" ON "MembershipSubscriptionPayment"("userId", "paidAt" DESC);

-- CreateIndex
CREATE INDEX "MembershipSubscriptionPayment_membershipSubscriptionId_idx" ON "MembershipSubscriptionPayment"("membershipSubscriptionId");

-- CreateIndex
CREATE INDEX "AllAccessWaitlistEntry_email_idx" ON "AllAccessWaitlistEntry"("email");

-- CreateIndex
CREATE INDEX "AllAccessWaitlistEntry_createdAt_idx" ON "AllAccessWaitlistEntry"("createdAt" DESC);

-- AddForeignKey
ALTER TABLE "MembershipSubscription" ADD CONSTRAINT "MembershipSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipSubscription" ADD CONSTRAINT "MembershipSubscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MembershipSubscriptionPayment" ADD CONSTRAINT "MembershipSubscriptionPayment_membershipSubscriptionId_fkey" FOREIGN KEY ("membershipSubscriptionId") REFERENCES "MembershipSubscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
