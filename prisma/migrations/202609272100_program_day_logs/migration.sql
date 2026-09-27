-- Game and practice day logging with stats

CREATE TYPE "DayLogType" AS ENUM ('GAME', 'PRACTICE');

CREATE TABLE "DayLog" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "programDay" INTEGER NOT NULL,
    "type" "DayLogType" NOT NULL,
    "note" VARCHAR(500) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DayLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "GameStats" (
    "id" TEXT NOT NULL,
    "dayLogId" TEXT NOT NULL,
    "opponent" VARCHAR(60),
    "atBats" INTEGER NOT NULL DEFAULT 0,
    "hits" INTEGER NOT NULL DEFAULT 0,
    "doubles" INTEGER NOT NULL DEFAULT 0,
    "triples" INTEGER NOT NULL DEFAULT 0,
    "homeRuns" INTEGER NOT NULL DEFAULT 0,
    "walks" INTEGER NOT NULL DEFAULT 0,
    "hitByPitch" INTEGER NOT NULL DEFAULT 0,
    "runs" INTEGER NOT NULL DEFAULT 0,
    "rbis" INTEGER NOT NULL DEFAULT 0,
    "strikeouts" INTEGER NOT NULL DEFAULT 0,
    "stolenBases" INTEGER NOT NULL DEFAULT 0,
    "errors" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "GameStats_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "TaskCompletion" ADD COLUMN "sourceDayLogId" TEXT;

CREATE INDEX "DayLog_enrollmentId_programDay_idx" ON "DayLog"("enrollmentId", "programDay");
CREATE UNIQUE INDEX "GameStats_dayLogId_key" ON "GameStats"("dayLogId");
CREATE INDEX "TaskCompletion_sourceDayLogId_idx" ON "TaskCompletion"("sourceDayLogId");

ALTER TABLE "DayLog" ADD CONSTRAINT "DayLog_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "GameStats" ADD CONSTRAINT "GameStats_dayLogId_fkey" FOREIGN KEY ("dayLogId") REFERENCES "DayLog"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_sourceDayLogId_fkey" FOREIGN KEY ("sourceDayLogId") REFERENCES "DayLog"("id") ON DELETE SET NULL ON UPDATE CASCADE;
