-- CreateEnum
CREATE TYPE "FreeSwingAnalysisResponseMode" AS ENUM ('VIDEO', 'WRITTEN_REPORT');

-- CreateTable
CREATE TABLE "AppAdminSettings" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "freeSwingAnalysisResponseMode" "FreeSwingAnalysisResponseMode" NOT NULL DEFAULT 'VIDEO',

    CONSTRAINT "AppAdminSettings_pkey" PRIMARY KEY ("id")
);

INSERT INTO "AppAdminSettings" ("id", "freeSwingAnalysisResponseMode")
VALUES (1, 'VIDEO')
ON CONFLICT ("id") DO NOTHING;
