-- Align schema.prisma with existing DB so migrate diff stays empty.
-- DailyChallengeSettings.id: app upserts with id "default"; no DB default.
-- MembershipSubscriptionPayment FK index already existed from phase 2a; declare in schema.

ALTER TABLE "DailyChallengeSettings" ALTER COLUMN "id" DROP DEFAULT;

CREATE INDEX IF NOT EXISTS "MembershipSubscriptionPayment_membershipSubscriptionId_idx"
  ON "MembershipSubscriptionPayment"("membershipSubscriptionId");
