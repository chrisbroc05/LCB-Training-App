-- AlterEnum
ALTER TYPE "PushNotificationType" ADD VALUE 'COACH_NEW_SUBMISSION';
ALTER TYPE "PushNotificationType" ADD VALUE 'COACH_NEW_PROGRAM_PLAYER';
ALTER TYPE "PushNotificationType" ADD VALUE 'COACH_NIGHTLY_SUMMARY';

-- DropIndex
DROP INDEX "PushSubscription_endpoint_key";

-- CreateTable
CREATE TABLE "CoachAlertSettings" (
    "userId" TEXT NOT NULL,
    "newVideosEnabled" BOOLEAN NOT NULL DEFAULT true,
    "newProgramPlayersEnabled" BOOLEAN NOT NULL DEFAULT true,
    "nightlySummaryPushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailNightlySummaryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachAlertSettings_pkey" PRIMARY KEY ("userId")
);

-- CreateIndex
CREATE INDEX "PushSubscription_endpoint_idx" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_userId_endpoint_key" ON "PushSubscription"("userId", "endpoint");

-- AddForeignKey
ALTER TABLE "CoachAlertSettings" ADD CONSTRAINT "CoachAlertSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
