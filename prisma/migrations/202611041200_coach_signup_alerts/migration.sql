-- CreateEnum
CREATE TYPE "CoachSignupAlertMode" AS ENUM ('INSTANT', 'DAILY', 'OFF');

-- AlterTable
ALTER TABLE "CoachAlertSettings" ADD COLUMN "newSignupAlertMode" "CoachSignupAlertMode" NOT NULL DEFAULT 'INSTANT';

-- AlterEnum
ALTER TYPE "PushNotificationType" ADD VALUE 'COACH_NEW_SIGNUP';
