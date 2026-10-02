-- CreateEnum
CREATE TYPE "AccountRole" AS ENUM ('PLAYER', 'PARENT');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "accountRole" "AccountRole" NOT NULL DEFAULT 'PLAYER';
ALTER TABLE "User" ADD COLUMN "accountHolderName" TEXT;
ALTER TABLE "User" ADD COLUMN "playerFirstName" TEXT;
ALTER TABLE "User" ADD COLUMN "playerLastName" TEXT;

-- Backfill player names from legacy name field
UPDATE "User"
SET
  "playerFirstName" = CASE
    WHEN "name" IS NULL OR btrim("name") = '' THEN NULL
    ELSE split_part(btrim("name"), ' ', 1)
  END,
  "playerLastName" = CASE
    WHEN "name" IS NULL OR btrim("name") = '' THEN NULL
    WHEN position(' ' in btrim("name")) = 0 THEN NULL
    ELSE btrim(substring(btrim("name") from position(' ' in btrim("name")) + 1))
  END
WHERE "name" IS NOT NULL AND btrim("name") <> '';
