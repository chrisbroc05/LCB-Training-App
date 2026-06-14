-- CreateEnum
CREATE TYPE "MentalGameTopic" AS ENUM (
    'SLUMP',
    'CONFIDENCE',
    'NERVES',
    'FEAR_OF_FAILURE',
    'PRESSURE_SITUATIONS',
    'LOSING_MOTIVATION',
    'OTHER'
);

-- CreateEnum
CREATE TYPE "MentalGameResponsePreference" AS ENUM ('VIDEO_RESPONSE', 'WRITTEN_RESPONSE');

-- CreateEnum
CREATE TYPE "MentalGameSubmissionStatus" AS ENUM ('PENDING', 'REVIEWING', 'COMPLETED');

-- CreateTable
CREATE TABLE "MentalGameSubmission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "playerAge" TEXT NOT NULL,
    "topic" "MentalGameTopic" NOT NULL,
    "message" TEXT NOT NULL,
    "videoPath" TEXT,
    "responsePreference" "MentalGameResponsePreference" NOT NULL,
    "status" "MentalGameSubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MentalGameSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MentalGameSubmission_userId_idx" ON "MentalGameSubmission"("userId");

-- AddForeignKey
ALTER TABLE "MentalGameSubmission" ADD CONSTRAINT "MentalGameSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
