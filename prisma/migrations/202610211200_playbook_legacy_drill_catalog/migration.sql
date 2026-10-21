-- AlterTable
ALTER TABLE "User" ADD COLUMN "playbookLegacyAccess" BOOLEAN NOT NULL DEFAULT false;

-- Grandfather existing Basic (Playbook) buyers before this change.
UPDATE "User" SET "playbookLegacyAccess" = true WHERE "membershipTier" = 'BASIC';

-- CreateTable
CREATE TABLE "DrillLibraryCatalog" (
    "vimeoId" TEXT NOT NULL,
    "isStarterDrill" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DrillLibraryCatalog_pkey" PRIMARY KEY ("vimeoId")
);
