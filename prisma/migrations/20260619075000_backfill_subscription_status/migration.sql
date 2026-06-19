-- Backfill existing users to active status
UPDATE "User"
SET "subscriptionStatus" = 'ACTIVE'
WHERE "subscriptionStatus" = 'NONE';
