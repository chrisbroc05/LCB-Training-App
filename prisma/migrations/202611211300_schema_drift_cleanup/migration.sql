-- Align schema.prisma with existing DB so migrate diff stays empty.
-- Safe on Neon (already applied shape) and on prod (may still have a default / missing index).
-- Does NOT touch TestSession or any testing partial unique indexes.

-- Harmless if no default is set (Postgres DROP DEFAULT is a no-op then).
ALTER TABLE "DailyChallengeSettings" ALTER COLUMN "id" DROP DEFAULT;

-- Harmless if the index already exists (from phase 2a migration).
CREATE INDEX IF NOT EXISTS "MembershipSubscriptionPayment_membershipSubscriptionId_idx"
  ON "MembershipSubscriptionPayment"("membershipSubscriptionId");
