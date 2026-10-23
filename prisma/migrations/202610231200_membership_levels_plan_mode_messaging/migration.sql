-- CreateEnum
CREATE TYPE "MembershipLevel" AS ENUM ('CORE', 'PLUS', 'ALL_ACCESS');

-- CreateEnum
CREATE TYPE "ProgramPlanMode" AS ENUM ('FIXED_12_WEEK', 'OPEN_ENDED');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "membershipLevel" "MembershipLevel",
ADD COLUMN "membershipLevelExpiresAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "ProgramEnrollment" ADD COLUMN "planMode" "ProgramPlanMode" NOT NULL DEFAULT 'FIXED_12_WEEK';

-- AlterTable: user-scoped messaging (PLUS) with optional program enrollment link
ALTER TABLE "Conversation" ADD COLUMN "userId" TEXT;

-- DropForeignKey
ALTER TABLE "Conversation" DROP CONSTRAINT "Conversation_enrollmentId_fkey";

-- AlterTable
ALTER TABLE "Conversation" ALTER COLUMN "enrollmentId" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_userId_key" ON "Conversation"("userId");

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
