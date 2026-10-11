-- AlterEnum
ALTER TYPE "PushNotificationType" ADD VALUE 'COACH_TASK_FEEDBACK';

-- CreateTable
CREATE TABLE "CoachNote" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "body" VARCHAR(2000) NOT NULL,
    "pinned" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CoachNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TaskFeedback" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "programDay" INTEGER NOT NULL,
    "taskKey" TEXT NOT NULL,
    "taskCompletionId" TEXT,
    "liked" BOOLEAN NOT NULL DEFAULT false,
    "comment" VARCHAR(500),
    "seenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskFeedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CoachNote_enrollmentId_pinned_updatedAt_idx" ON "CoachNote"("enrollmentId", "pinned", "updatedAt" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "TaskFeedback_taskCompletionId_key" ON "TaskFeedback"("taskCompletionId");

-- CreateIndex
CREATE INDEX "TaskFeedback_enrollmentId_seenAt_idx" ON "TaskFeedback"("enrollmentId", "seenAt");

-- CreateIndex
CREATE INDEX "TaskFeedback_enrollmentId_programDay_idx" ON "TaskFeedback"("enrollmentId", "programDay");

-- CreateIndex
CREATE UNIQUE INDEX "TaskFeedback_enrollmentId_programDay_taskKey_key" ON "TaskFeedback"("enrollmentId", "programDay", "taskKey");

-- AddForeignKey
ALTER TABLE "CoachNote" ADD CONSTRAINT "CoachNote_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFeedback" ADD CONSTRAINT "TaskFeedback_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskFeedback" ADD CONSTRAINT "TaskFeedback_taskCompletionId_fkey" FOREIGN KEY ("taskCompletionId") REFERENCES "TaskCompletion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
