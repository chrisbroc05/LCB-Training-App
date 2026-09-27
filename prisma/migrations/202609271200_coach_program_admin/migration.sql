-- Coach program admin: cues, week focus overrides, custom tasks

CREATE TABLE "CoachCue" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "drillIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "defaultWeek" INTEGER,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoachCue_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WeekFocusOverride" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "weekNumber" INTEGER NOT NULL,
    "cueId" TEXT NOT NULL,
    "note" VARCHAR(300) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WeekFocusOverride_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "CustomTask" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "programDay" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "target" TEXT NOT NULL,
    "details" TEXT,
    "drillIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "replacesTaskKey" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CustomTask_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WeekFocusOverride_enrollmentId_weekNumber_key" ON "WeekFocusOverride"("enrollmentId", "weekNumber");
CREATE INDEX "WeekFocusOverride_enrollmentId_idx" ON "WeekFocusOverride"("enrollmentId");
CREATE INDEX "CustomTask_enrollmentId_programDay_idx" ON "CustomTask"("enrollmentId", "programDay");

ALTER TABLE "WeekFocusOverride" ADD CONSTRAINT "WeekFocusOverride_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WeekFocusOverride" ADD CONSTRAINT "WeekFocusOverride_cueId_fkey" FOREIGN KEY ("cueId") REFERENCES "CoachCue"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CustomTask" ADD CONSTRAINT "CustomTask_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed 12 default weekly hitting cues
INSERT INTO "CoachCue" ("id", "label", "drillIds", "isDefault", "defaultWeek", "archived", "createdAt") VALUES
('default_cue_week_01', 'Stance and balance', ARRAY['1200422516','1207514238'], true, 1, false, CURRENT_TIMESTAMP),
('default_cue_week_02', 'Load and timing', ARRAY['1200422510','1200422500'], true, 2, false, CURRENT_TIMESTAMP),
('default_cue_week_03', 'Staying on the back side', ARRAY['1207514238','1200422500'], true, 3, false, CURRENT_TIMESTAMP),
('default_cue_week_04', 'Swing path through the middle', ARRAY['1200422517','1200422515','1207510044','1200422514','1207509269','1207507965'], true, 4, false, CURRENT_TIMESTAMP),
('default_cue_week_05', 'Inside pitch', ARRAY['1207512012','1200422514'], true, 5, false, CURRENT_TIMESTAMP),
('default_cue_week_06', 'Outside pitch, going the other way', ARRAY['1207513205','1207511052'], true, 6, false, CURRENT_TIMESTAMP),
('default_cue_week_07', 'Hard line drives', ARRAY['1207509269','1200422511','1200422512'], true, 7, false, CURRENT_TIMESTAMP),
('default_cue_week_08', 'Two-strike approach', ARRAY[]::TEXT[], true, 8, false, CURRENT_TIMESTAMP),
('default_cue_week_09', 'Timing against velocity', ARRAY['1207507965'], true, 9, false, CURRENT_TIMESTAMP),
('default_cue_week_10', 'Situational hitting (runner on 3rd, move the runner)', ARRAY[]::TEXT[], true, 10, false, CURRENT_TIMESTAMP),
('default_cue_week_11', 'Approach by count', ARRAY['1207516198'], true, 11, false, CURRENT_TIMESTAMP),
('default_cue_week_12', 'Game at-bats: every rep is a count and a situation', ARRAY['1207516198'], true, 12, false, CURRENT_TIMESTAMP);
