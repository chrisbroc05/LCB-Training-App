-- CreateEnum
CREATE TYPE "ProgramEnrollmentStatus" AS ENUM ('ACTIVE', 'PAUSED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "ProgramAgeGroup" AS ENUM ('AGE_8_11', 'AGE_12_15', 'AGE_16_18');

-- CreateEnum
CREATE TYPE "ProgramSeasonMode" AS ENUM ('IN_SEASON', 'OFF_SEASON');

-- CreateTable
CREATE TABLE "ProgramEnrollment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "ProgramEnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    "startDate" DATE,
    "ageGroup" "ProgramAgeGroup",
    "position" TEXT,
    "focusAreas" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "equipment" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "seasonMode" "ProgramSeasonMode",
    "knownFor" TEXT,
    "onboardingCompletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProgramEnrollment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramEnrollment_userId_key" ON "ProgramEnrollment"("userId");

-- AddForeignKey
ALTER TABLE "ProgramEnrollment" ADD CONSTRAINT "ProgramEnrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
