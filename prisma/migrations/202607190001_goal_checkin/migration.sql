-- CreateTable
CREATE TABLE "GoalCheckin" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "monthlyFocus" TEXT NOT NULL,
    "lastMonthReview" TEXT NOT NULL,
    "focusArea" TEXT NOT NULL,
    "additionalNotes" TEXT,
    "coachResponse" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "GoalCheckin_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoalCheckin_userId_idx" ON "GoalCheckin"("userId");

-- CreateIndex
CREATE INDEX "GoalCheckin_userId_createdAt_idx" ON "GoalCheckin"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "GoalCheckin" ADD CONSTRAINT "GoalCheckin_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
