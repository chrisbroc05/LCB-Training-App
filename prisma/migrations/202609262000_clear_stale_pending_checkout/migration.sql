-- Clear stale pending checkout intents left over from failed sign-up flows.
UPDATE "User"
SET "pendingCheckoutTier" = NULL
WHERE "pendingCheckoutTier" IS NOT NULL;
