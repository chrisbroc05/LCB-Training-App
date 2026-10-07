-- CreateEnum
CREATE TYPE "TestBetterIs" AS ENUM ('LOWER', 'HIGHER');

-- CreateTable
CREATE TABLE "TestTeam" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "season" TEXT NOT NULL,
    "coachName" TEXT NOT NULL,
    "coachEmail" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestPlayer" (
    "id" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "birthYear" INTEGER,
    "age" INTEGER,
    "positions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "bats" TEXT,
    "throws" TEXT,
    "parentEmail" TEXT,
    "claimCode" TEXT NOT NULL,
    "userId" TEXT,
    "waiverSignatureId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestTeamPlayer" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,

    CONSTRAINT "TestTeamPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestMetric" (
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "decimals" INTEGER NOT NULL,
    "betterIs" "TestBetterIs" NOT NULL,
    "category" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL,
    "inputType" TEXT NOT NULL DEFAULT 'number',

    CONSTRAINT "TestMetric_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "TestSession" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "label" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "TestSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestResult" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "metricKey" TEXT NOT NULL,
    "attempts" DOUBLE PRECISION[] DEFAULT ARRAY[]::DOUBLE PRECISION[],
    "best" DOUBLE PRECISION,
    "absent" BOOLEAN NOT NULL DEFAULT false,
    "skipped" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestResult_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestTeam_archived_createdAt_idx" ON "TestTeam"("archived", "createdAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TestPlayer_claimCode_key" ON "TestPlayer"("claimCode");

-- CreateIndex
CREATE INDEX "TestPlayer_lastName_firstName_idx" ON "TestPlayer"("lastName", "firstName");

-- CreateIndex
CREATE INDEX "TestPlayer_userId_idx" ON "TestPlayer"("userId");

-- CreateIndex
CREATE INDEX "TestPlayer_waiverSignatureId_idx" ON "TestPlayer"("waiverSignatureId");

-- CreateIndex
CREATE INDEX "TestTeamPlayer_playerId_idx" ON "TestTeamPlayer"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "TestTeamPlayer_teamId_playerId_key" ON "TestTeamPlayer"("teamId", "playerId");

-- CreateIndex
CREATE INDEX "TestMetric_active_sortOrder_idx" ON "TestMetric"("active", "sortOrder");

-- CreateIndex
CREATE INDEX "TestSession_teamId_date_idx" ON "TestSession"("teamId", "date" DESC);

-- CreateIndex
CREATE INDEX "TestResult_playerId_metricKey_idx" ON "TestResult"("playerId", "metricKey");

-- CreateIndex
CREATE INDEX "TestResult_sessionId_metricKey_idx" ON "TestResult"("sessionId", "metricKey");

-- CreateIndex
CREATE UNIQUE INDEX "TestResult_sessionId_playerId_metricKey_key" ON "TestResult"("sessionId", "playerId", "metricKey");

-- AddForeignKey
ALTER TABLE "TestPlayer" ADD CONSTRAINT "TestPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestPlayer" ADD CONSTRAINT "TestPlayer_waiverSignatureId_fkey" FOREIGN KEY ("waiverSignatureId") REFERENCES "WaiverSignature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestTeamPlayer" ADD CONSTRAINT "TestTeamPlayer_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TestTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestTeamPlayer" ADD CONSTRAINT "TestTeamPlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "TestPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSession" ADD CONSTRAINT "TestSession_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "TestTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "TestSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "TestPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestResult" ADD CONSTRAINT "TestResult_metricKey_fkey" FOREIGN KEY ("metricKey") REFERENCES "TestMetric"("key") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default metrics
INSERT INTO "TestMetric" ("key", "label", "unit", "decimals", "betterIs", "category", "active", "sortOrder", "inputType") VALUES
('ten_yard', '10-Yard Sprint', 'sec', 2, 'LOWER', 'speed', true, 10, 'number'),
('sixty_yard', '60-Yard Dash', 'sec', 2, 'LOWER', 'speed', true, 20, 'number'),
('home_to_first', 'Home to First', 'sec', 2, 'LOWER', 'speed', true, 30, 'number'),
('pro_agility', '5-10-5 Pro Agility', 'sec', 2, 'LOWER', 'agility', true, 40, 'number'),
('broad_jump', 'Broad Jump', 'in', 0, 'HIGHER', 'power', true, 50, 'feet_inches'),
('vertical_jump', 'Vertical Jump', 'in', 1, 'HIGHER', 'power', true, 60, 'number'),
('med_ball_rot', 'Rotational Med Ball Throw', 'mph', 1, 'HIGHER', 'power', true, 70, 'number'),
('exit_velo_tee', 'Exit Velo (Tee)', 'mph', 1, 'HIGHER', 'hitting', true, 80, 'number'),
('throw_velo_if', 'Infield Throwing Velo', 'mph', 1, 'HIGHER', 'throwing', true, 90, 'number'),
('throw_velo_of', 'Outfield Throwing Velo', 'mph', 1, 'HIGHER', 'throwing', true, 100, 'number'),
('pitch_velo', 'Pitching Velo', 'mph', 1, 'HIGHER', 'pitching', true, 110, 'number'),
('pop_time', 'Pop Time (Catchers)', 'sec', 2, 'LOWER', 'catching', true, 120, 'number'),
('height', 'Height', 'in', 1, 'HIGHER', 'body', true, 130, 'number'),
('weight', 'Weight', 'lbs', 0, 'HIGHER', 'body', true, 140, 'number');
