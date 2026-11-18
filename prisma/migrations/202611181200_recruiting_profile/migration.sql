-- AlterEnum
ALTER TYPE "PushNotificationType" ADD VALUE 'RECRUITING_SCHOOL_LIST';

-- CreateTable
CREATE TABLE "RecruitingProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "gradYear" INTEGER,
    "primaryPosition" TEXT,
    "secondaryPosition" TEXT,
    "levelsOpenTo" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "locationPreference" TEXT,
    "schoolSize" TEXT,
    "majorOrStudy" TEXT,
    "gpaRange" TEXT,
    "scholarshipImportance" TEXT,
    "videoUrl" TEXT,
    "notesForCoach" TEXT,
    "coachSchoolList" TEXT,
    "answersUpdatedAt" TIMESTAMP(3),
    "schoolListUpdatedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RecruitingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RecruitingProfile_userId_key" ON "RecruitingProfile"("userId");

-- CreateIndex
CREATE INDEX "RecruitingProfile_enabled_idx" ON "RecruitingProfile"("enabled");

-- AddForeignKey
ALTER TABLE "RecruitingProfile" ADD CONSTRAINT "RecruitingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
