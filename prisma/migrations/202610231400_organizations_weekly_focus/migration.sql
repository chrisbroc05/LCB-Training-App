-- CreateEnum
CREATE TYPE "OrgBillingMode" AS ENUM ('FAMILY_PAY', 'CLUB_PAY');

-- CreateEnum
CREATE TYPE "CoachingReviewTrack" AS ENUM ('FREE_ONCE', 'PLAYBOOK', 'QUICK_SIX_WEEK', 'ORG_TRIAL_QUICK', 'IN_DEPTH_MONTHLY', 'PROGRAM');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "billingMode" "OrgBillingMode" NOT NULL DEFAULT 'FAMILY_PAY',
    "coveredLevel" "MembershipLevel",
    "trialStartsAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "trialLockedCopy" TEXT,
    "commissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "commissionMonths" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgCode" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgCode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgTeam" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrgTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrgWeeklyFocus" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "orgTeamId" TEXT,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "title" TEXT NOT NULL,
    "notes" TEXT,
    "drillIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrgWeeklyFocus_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "organizationId" TEXT,
ADD COLUMN     "orgTeamId" TEXT,
ADD COLUMN     "orgJoinedAt" TIMESTAMP(3),
ADD COLUMN     "orgTrialQuickReportUsed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "coreQuickReportNextEligibleAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SwingAnalysisSubmission" ADD COLUMN     "reviewTrack" "CoachingReviewTrack",
ADD COLUMN     "coachFocusPreset" TEXT,
ADD COLUMN     "coachFocusEndsAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "OrgCode_code_key" ON "OrgCode"("code");

-- CreateIndex
CREATE INDEX "OrgCode_organizationId_idx" ON "OrgCode"("organizationId");

-- CreateIndex
CREATE INDEX "OrgTeam_organizationId_idx" ON "OrgTeam"("organizationId");

-- CreateIndex
CREATE INDEX "OrgWeeklyFocus_organizationId_weekStartDate_idx" ON "OrgWeeklyFocus"("organizationId", "weekStartDate");

-- CreateIndex
CREATE INDEX "OrgWeeklyFocus_orgTeamId_weekStartDate_idx" ON "OrgWeeklyFocus"("orgTeamId", "weekStartDate");

-- CreateIndex
CREATE INDEX "User_organizationId_idx" ON "User"("organizationId");

-- CreateIndex
CREATE INDEX "User_orgTeamId_idx" ON "User"("orgTeamId");

-- CreateIndex
CREATE INDEX "SwingAnalysisSubmission_reviewTrack_status_createdAt_idx" ON "SwingAnalysisSubmission"("reviewTrack", "status", "createdAt");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_orgTeamId_fkey" FOREIGN KEY ("orgTeamId") REFERENCES "OrgTeam"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgCode" ADD CONSTRAINT "OrgCode_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgTeam" ADD CONSTRAINT "OrgTeam_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgWeeklyFocus" ADD CONSTRAINT "OrgWeeklyFocus_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrgWeeklyFocus" ADD CONSTRAINT "OrgWeeklyFocus_orgTeamId_fkey" FOREIGN KEY ("orgTeamId") REFERENCES "OrgTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
