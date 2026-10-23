-- AlterTable
ALTER TABLE "OrgTeam" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "orgTeamChangedAt" TIMESTAMP(3);
