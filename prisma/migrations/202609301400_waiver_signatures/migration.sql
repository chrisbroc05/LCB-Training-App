-- CreateEnum
CREATE TYPE "WaiverSignupType" AS ENUM ('PRIVATE_LESSONS', 'GROUP_LESSONS', 'TEAM_TRAINING', 'OTHER');

-- AlterEnum
ALTER TYPE "PushNotificationType" ADD VALUE 'COACH_WAIVER_SIGNED';

-- CreateTable
CREATE TABLE "WaiverSignature" (
    "id" TEXT NOT NULL,
    "playerFirstName" TEXT NOT NULL,
    "playerLastName" TEXT NOT NULL,
    "playerAge" INTEGER NOT NULL,
    "teamName" TEXT,
    "teamSlug" TEXT,
    "signupType" "WaiverSignupType" NOT NULL,
    "signerFullName" TEXT NOT NULL,
    "signerEmail" TEXT NOT NULL,
    "signerPhone" TEXT,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "medicalNotes" TEXT,
    "mediaConsent" BOOLEAN NOT NULL DEFAULT false,
    "typedSignature" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "signedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ip" TEXT NOT NULL,
    "userId" TEXT,

    CONSTRAINT "WaiverSignature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WaiverSignature_signedAt_idx" ON "WaiverSignature"("signedAt" DESC);

-- CreateIndex
CREATE INDEX "WaiverSignature_teamSlug_idx" ON "WaiverSignature"("teamSlug");

-- CreateIndex
CREATE INDEX "WaiverSignature_signerEmail_idx" ON "WaiverSignature"("signerEmail");

-- CreateIndex
CREATE INDEX "WaiverSignature_userId_idx" ON "WaiverSignature"("userId");

-- CreateIndex
CREATE INDEX "WaiverSignature_ip_signedAt_idx" ON "WaiverSignature"("ip", "signedAt");

-- AddForeignKey
ALTER TABLE "WaiverSignature" ADD CONSTRAINT "WaiverSignature_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
