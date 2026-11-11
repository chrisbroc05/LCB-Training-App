-- CreateEnum
CREATE TYPE "DailyChallengeAgeGroup" AS ENUM ('AGE_8_11', 'AGE_12_14', 'AGE_15_PLUS');

-- CreateEnum
CREATE TYPE "DailyQuestionType" AS ENUM ('TRIVIA', 'MINDSET');

-- AlterEnum
ALTER TYPE "PushNotificationType" ADD VALUE 'DAILY_CHALLENGE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "hideFromLeaderboards" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "DailyChallengeSettings" (
    "id" TEXT NOT NULL,
    "pushHourChicago" INTEGER NOT NULL DEFAULT 15,
    "pushMinuteChicago" INTEGER NOT NULL DEFAULT 30,

    CONSTRAINT "DailyChallengeSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallenge" (
    "id" TEXT NOT NULL,
    "ageGroup" "DailyChallengeAgeGroup" NOT NULL,
    "rotationDay" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "drillLibraryVimeoId" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyChallenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyQuestion" (
    "id" TEXT NOT NULL,
    "ageGroup" "DailyChallengeAgeGroup",
    "rotationDay" INTEGER NOT NULL,
    "type" "DailyQuestionType" NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "correctOptionIndex" INTEGER,
    "explanation" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyChallengeCompletion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chicagoDate" TEXT NOT NULL,
    "ageGroup" "DailyChallengeAgeGroup" NOT NULL,
    "challengeId" TEXT NOT NULL,
    "questionId" TEXT,
    "challengeDoneAt" TIMESTAMP(3),
    "triviaSelectedIndex" INTEGER,
    "triviaCorrect" BOOLEAN,
    "mindsetAnswer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyChallengeCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallenge_ageGroup_rotationDay_key" ON "DailyChallenge"("ageGroup", "rotationDay");

-- CreateIndex
CREATE INDEX "DailyChallenge_ageGroup_active_rotationDay_idx" ON "DailyChallenge"("ageGroup", "active", "rotationDay");

-- CreateIndex
CREATE INDEX "DailyQuestion_type_ageGroup_active_rotationDay_idx" ON "DailyQuestion"("type", "ageGroup", "active", "rotationDay");

-- CreateIndex
CREATE INDEX "DailyQuestion_type_active_rotationDay_idx" ON "DailyQuestion"("type", "active", "rotationDay");

-- CreateIndex
CREATE UNIQUE INDEX "DailyChallengeCompletion_userId_chicagoDate_key" ON "DailyChallengeCompletion"("userId", "chicagoDate");

-- CreateIndex
CREATE INDEX "DailyChallengeCompletion_userId_chicagoDate_idx" ON "DailyChallengeCompletion"("userId", "chicagoDate");

-- CreateIndex
CREATE INDEX "DailyChallengeCompletion_chicagoDate_ageGroup_idx" ON "DailyChallengeCompletion"("chicagoDate", "ageGroup");

-- CreateIndex
CREATE INDEX "DailyChallengeCompletion_challengeId_idx" ON "DailyChallengeCompletion"("challengeId");

-- CreateIndex
CREATE INDEX "DailyChallengeCompletion_questionId_idx" ON "DailyChallengeCompletion"("questionId");

-- AddForeignKey
ALTER TABLE "DailyChallengeCompletion" ADD CONSTRAINT "DailyChallengeCompletion_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeCompletion" ADD CONSTRAINT "DailyChallengeCompletion_challengeId_fkey" FOREIGN KEY ("challengeId") REFERENCES "DailyChallenge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyChallengeCompletion" ADD CONSTRAINT "DailyChallengeCompletion_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "DailyQuestion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed settings row
INSERT INTO "DailyChallengeSettings" ("id", "pushHourChicago", "pushMinuteChicago")
VALUES ('default', 15, 30)
ON CONFLICT ("id") DO NOTHING;
