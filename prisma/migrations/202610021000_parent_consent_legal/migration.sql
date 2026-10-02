ALTER TABLE "User" ADD COLUMN "playerAge" INTEGER;
ALTER TABLE "User" ADD COLUMN "parentConsentName" TEXT;
ALTER TABLE "User" ADD COLUMN "parentConsentEmail" TEXT;
ALTER TABLE "User" ADD COLUMN "parentConsentConfirmedAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "parentConsentEmailSentAt" TIMESTAMP(3);
ALTER TABLE "User" ADD COLUMN "parentConsentReminderSentAt" TIMESTAMP(3);
