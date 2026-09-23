ALTER TABLE "User"
ADD COLUMN "twelveWeekCallBooked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "twelveWeekCallScheduledAt" TIMESTAMP(3);
