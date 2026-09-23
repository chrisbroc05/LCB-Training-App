-- Migrate legacy Memorable and Elite subscriptions to the 12-Week Coaching Program model.
UPDATE "User"
SET
  "membershipTier" = 'TWELVE_WEEK',
  "twelveWeekProgramStartedAt" = COALESCE("twelveWeekProgramStartedAt", NOW()),
  "twelveWeekProgramEndsAt" = COALESCE(
    "twelveWeekProgramEndsAt",
    NOW() + INTERVAL '12 weeks'
  ),
  "subscriptionStatus" = 'NONE',
  "stripeSubscriptionId" = NULL,
  "stripePriceId" = NULL,
  "subscriptionCurrentPeriodEnd" = NULL,
  "subscriptionCancelAtPeriodEnd" = false
WHERE "membershipTier" IN ('MEMORABLE', 'ELITE');
