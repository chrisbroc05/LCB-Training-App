-- Add teamSlug to TestTeam
ALTER TABLE "TestTeam" ADD COLUMN "teamSlug" TEXT;

UPDATE "TestTeam"
SET "teamSlug" = lower(regexp_replace(trim("name"), '\s+', '-', 'g'))
WHERE "teamSlug" IS NULL;

ALTER TABLE "TestTeam" ALTER COLUMN "teamSlug" SET NOT NULL;
CREATE UNIQUE INDEX "TestTeam_teamSlug_key" ON "TestTeam"("teamSlug");

ALTER TABLE "TestTeam" ALTER COLUMN "season" SET DEFAULT '';
ALTER TABLE "TestTeam" ALTER COLUMN "coachName" SET DEFAULT '';

-- One session per team per date
CREATE UNIQUE INDEX "TestSession_teamId_date_key" ON "TestSession"("teamId", "date");

-- Stations
CREATE TABLE "TestStation" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metricKeys" TEXT[],

    CONSTRAINT "TestStation_pkey" PRIMARY KEY ("key")
);

CREATE INDEX "TestStation_active_sortOrder_idx" ON "TestStation"("active", "sortOrder");

INSERT INTO "TestStation" ("key", "label", "sortOrder", "active", "metricKeys") VALUES
('speed_power', 'Speed and Power', 10, true, ARRAY['ten_yard', 'pro_agility', 'broad_jump']),
('hitting', 'Hitting', 20, true, ARRAY['exit_velo_tee', 'med_ball_rot']);
