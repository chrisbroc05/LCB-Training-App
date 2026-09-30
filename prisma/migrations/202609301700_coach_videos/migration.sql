-- CreateEnum
CREATE TYPE "CoachVideoDrillCategory" AS ENUM ('HITTING', 'FIELDING', 'MINDSET', 'OTHER');

-- AlterEnum
ALTER TYPE "ProgramEmailType" ADD VALUE 'COACH_VIDEO';

-- AlterEnum
ALTER TYPE "PushNotificationType" ADD VALUE 'COACH_VIDEO';

-- CreateTable
CREATE TABLE "CoachVideo" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enrollmentId" TEXT,
    "title" TEXT NOT NULL,
    "note" TEXT,
    "videoKey" TEXT NOT NULL,
    "videoContentType" TEXT NOT NULL,
    "videoSizeBytes" INTEGER NOT NULL,
    "drillCategory" "CoachVideoDrillCategory",
    "notifyPending" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "viewedAt" TIMESTAMP(3),

    CONSTRAINT "CoachVideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachVideo_userId_createdAt_idx" ON "CoachVideo"("userId", "createdAt" DESC);

-- CreateIndex
CREATE INDEX "CoachVideo_enrollmentId_idx" ON "CoachVideo"("enrollmentId");

-- CreateIndex
CREATE INDEX "CoachVideo_notifyPending_idx" ON "CoachVideo"("notifyPending");

-- AddForeignKey
ALTER TABLE "CoachVideo" ADD CONSTRAINT "CoachVideo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CoachVideo" ADD CONSTRAINT "CoachVideo_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
