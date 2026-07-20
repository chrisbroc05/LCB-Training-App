ALTER TABLE "User"
ADD COLUMN "position" TEXT,
ADD COLUMN "age" INTEGER,
ADD COLUMN "graduationYear" INTEGER,
ADD COLUMN "currentTeam" TEXT,
ADD COLUMN "level" TEXT,
ADD COLUMN "playerBio" TEXT,
ADD COLUMN "notifySubmissionResponse" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notifyGoalResponse" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notifyWeeklyCheckin" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "notifyAnnouncements" BOOLEAN NOT NULL DEFAULT true;
