-- Track monthly coaching submission usage and Elite rollover credits
ALTER TABLE "User"
ADD COLUMN "coachingSubmissionsUsedThisMonth" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "coachingSubmissionPeriod" TEXT,
ADD COLUMN "eliteRolloverCredits" INTEGER NOT NULL DEFAULT 0;
