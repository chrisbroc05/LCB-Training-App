ALTER TABLE "User" ADD COLUMN "pendingCheckoutBillingInterval" "MembershipBillingInterval";
ALTER TABLE "User" ADD COLUMN "pendingCheckoutAt" TIMESTAMP(3);
