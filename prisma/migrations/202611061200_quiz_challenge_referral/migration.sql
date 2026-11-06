-- Track quiz challenge referrals on attempts and leads.
ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "quizChallengeRef" TEXT;
ALTER TABLE "QuizAttempt" ADD COLUMN IF NOT EXISTS "quizReferralSource" TEXT;
