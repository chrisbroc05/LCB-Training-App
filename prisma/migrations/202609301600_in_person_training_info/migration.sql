-- AlterTable
ALTER TABLE "User" ADD COLUMN     "trainsInPerson" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emergencyContactName" TEXT,
ADD COLUMN     "emergencyContactPhone" TEXT,
ADD COLUMN     "medicalNotes" TEXT,
ADD COLUMN     "inPersonInfoUpdatedAt" TIMESTAMP(3);
