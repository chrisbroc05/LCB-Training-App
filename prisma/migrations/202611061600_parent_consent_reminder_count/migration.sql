-- Cap parent consent reminders: count sends; backfill from legacy single-shot timestamp.
ALTER TABLE "User" ADD COLUMN "parentConsentReminderCount" INTEGER NOT NULL DEFAULT 0;

UPDATE "User"
SET "parentConsentReminderCount" = 1
WHERE "parentConsentReminderSentAt" IS NOT NULL
  AND "parentConsentReminderCount" = 0;
