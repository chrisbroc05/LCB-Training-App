-- Set admin test account to Elite tier for member experience testing.
UPDATE "User"
SET "membershipTier" = 'ELITE'
WHERE LOWER(TRIM("email")) = LOWER('chrisbroc05@gmail.com');
