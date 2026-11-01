-- Rename gross amount to amountPaidCents on membership payments
ALTER TABLE "MembershipSubscriptionPayment" RENAME COLUMN "amountCents" TO "amountPaidCents";

ALTER TABLE "MembershipSubscriptionPayment" ADD COLUMN "processingFeeCents" INTEGER;
ALTER TABLE "MembershipSubscriptionPayment" ADD COLUMN "netCents" INTEGER;
ALTER TABLE "MembershipSubscriptionPayment" ADD COLUMN "stripeChargeId" TEXT;
ALTER TABLE "MembershipSubscriptionPayment" ADD COLUMN "commissionFeePending" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "MembershipSubscriptionPayment_commissionFeePending_idx" ON "MembershipSubscriptionPayment"("commissionFeePending");

-- Ledger: net fee fields; backfill amountPaidCents from legacy paymentCents
ALTER TABLE "OrgCommissionLedgerEntry" ADD COLUMN "amountPaidCents" INTEGER;
ALTER TABLE "OrgCommissionLedgerEntry" ADD COLUMN "processingFeeCents" INTEGER;
ALTER TABLE "OrgCommissionLedgerEntry" ADD COLUMN "netCents" INTEGER;
ALTER TABLE "OrgCommissionLedgerEntry" ADD COLUMN "commissionFeePending" BOOLEAN NOT NULL DEFAULT false;

UPDATE "OrgCommissionLedgerEntry" SET "amountPaidCents" = "paymentCents" WHERE "amountPaidCents" IS NULL;
UPDATE "OrgCommissionLedgerEntry" SET "netCents" = "paymentCents" WHERE "netCents" IS NULL;

ALTER TABLE "OrgCommissionLedgerEntry" ALTER COLUMN "amountPaidCents" SET NOT NULL;

CREATE INDEX "OrgCommissionLedgerEntry_commissionFeePending_idx" ON "OrgCommissionLedgerEntry"("commissionFeePending");
