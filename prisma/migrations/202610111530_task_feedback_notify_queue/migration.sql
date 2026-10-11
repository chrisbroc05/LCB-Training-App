ALTER TABLE "ProgramEnrollment" ADD COLUMN "lastTaskFeedbackNotifyAt" TIMESTAMP(3);
ALTER TABLE "ProgramEnrollment" ADD COLUMN "taskFeedbackNotifyPending" BOOLEAN NOT NULL DEFAULT false;
