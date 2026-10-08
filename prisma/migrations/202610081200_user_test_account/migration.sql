-- AlterEnum
ALTER TYPE "ProgramEmailType" ADD VALUE 'SETUP_REMINDER';

-- AlterEnum
ALTER TYPE "PushNotificationType" ADD VALUE 'SETUP_REMINDER';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "isTestAccount" BOOLEAN NOT NULL DEFAULT false;

-- Backfill emails containing +test
UPDATE "User" SET "isTestAccount" = true WHERE LOWER("email") LIKE '%+test%';
