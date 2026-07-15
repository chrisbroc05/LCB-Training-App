-- AlterTable
ALTER TABLE "User" ADD COLUMN "assessmentCallBooked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "assessmentCallDate" TIMESTAMP(3);
