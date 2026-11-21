-- Individual testing sessions (no team) + Bat Speed metric.
-- NOTE: Partial unique indexes below are intentional and are NOT modeled in schema.prisma
-- (Prisma lacks partial unique support). Do not replace them with a full @@unique([teamId, date]).

DROP INDEX IF EXISTS "TestSession_teamId_date_key";

ALTER TABLE "TestSession" ALTER COLUMN "teamId" DROP NOT NULL;

CREATE UNIQUE INDEX "TestSession_teamId_date_key"
  ON "TestSession" ("teamId", "date")
  WHERE "teamId" IS NOT NULL;

CREATE UNIQUE INDEX "TestSession_individual_date_key"
  ON "TestSession" ("date")
  WHERE "teamId" IS NULL;

CREATE INDEX "TestSession_date_idx" ON "TestSession"("date");

INSERT INTO "TestMetric" ("key", "label", "unit", "decimals", "betterIs", "category", "active", "sortOrder", "inputType")
VALUES ('bat_speed', 'Bat Speed', 'mph', 1, 'HIGHER', 'hitting', true, 85, 'number')
ON CONFLICT ("key") DO UPDATE SET
  "label" = EXCLUDED."label",
  "unit" = EXCLUDED."unit",
  "decimals" = EXCLUDED."decimals",
  "betterIs" = EXCLUDED."betterIs",
  "category" = EXCLUDED."category",
  "active" = EXCLUDED."active",
  "sortOrder" = EXCLUDED."sortOrder",
  "inputType" = EXCLUDED."inputType";

UPDATE "TestStation"
SET "metricKeys" = CASE
  WHEN NOT ("metricKeys" @> ARRAY['bat_speed']::text[])
    THEN array_append("metricKeys", 'bat_speed')
  ELSE "metricKeys"
END
WHERE "key" = 'hitting';
