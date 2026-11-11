-- AlterEnum
ALTER TYPE "PushNotificationType" ADD VALUE 'ORG_TEAM_PICK';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "orgTeamNotListedAt" TIMESTAMP(3),
ADD COLUMN "orgTeamPickNudgeSentAt" TIMESTAMP(3);
