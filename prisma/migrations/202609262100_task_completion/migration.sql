-- CreateTable
CREATE TABLE "TaskCompletion" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "programDay" INTEGER NOT NULL,
    "taskKey" TEXT NOT NULL,
    "taskType" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TaskCompletion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskCompletion_enrollmentId_programDay_taskKey_key" ON "TaskCompletion"("enrollmentId", "programDay", "taskKey");

-- CreateIndex
CREATE INDEX "TaskCompletion_enrollmentId_programDay_idx" ON "TaskCompletion"("enrollmentId", "programDay");

-- AddForeignKey
ALTER TABLE "TaskCompletion" ADD CONSTRAINT "TaskCompletion_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
