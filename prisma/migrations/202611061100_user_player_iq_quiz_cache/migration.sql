-- Cache latest Player IQ quiz result on user profile (logged-in completions).
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastPlayerIqQuizScore" INTEGER;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastPlayerIqQuizLevel" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastPlayerIqQuizCompletedAt" TIMESTAMP(3);
