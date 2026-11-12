-- CreateEnum
CREATE TYPE "ClinicSport" AS ENUM ('BASEBALL', 'SOFTBALL');

-- CreateEnum
CREATE TYPE "ClinicRegistrationStatus" AS ENUM ('PENDING', 'PAID', 'EXPIRED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "Clinic" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "agesSportsText" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "whatToBring" TEXT NOT NULL,
    "refundPolicyText" TEXT NOT NULL,
    "startTimeLocal" TEXT NOT NULL,
    "endTimeLocal" TEXT NOT NULL,
    "pricePerDayCents" INTEGER NOT NULL,
    "allDaysPriceCents" INTEGER NOT NULL,
    "capacityPerDay" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "closed" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clinic_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicDay" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicRegistration" (
    "id" TEXT NOT NULL,
    "clinicId" TEXT NOT NULL,
    "userId" TEXT,
    "waiverSignatureId" TEXT,
    "parentName" TEXT NOT NULL,
    "parentEmail" TEXT NOT NULL,
    "parentPhone" TEXT,
    "playerName" TEXT NOT NULL,
    "playerAge" INTEGER NOT NULL,
    "sport" "ClinicSport" NOT NULL,
    "position" TEXT,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactPhone" TEXT NOT NULL,
    "typedSignature" TEXT NOT NULL,
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "termsVersion" TEXT NOT NULL,
    "waiverAcknowledgedAt" TIMESTAMP(3) NOT NULL,
    "acceptedByName" TEXT NOT NULL,
    "mediaConsent" BOOLEAN NOT NULL DEFAULT false,
    "mediaConsentUpdatedAt" TIMESTAMP(3),
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "isAllDaysBundle" BOOLEAN NOT NULL DEFAULT false,
    "amountCents" INTEGER NOT NULL,
    "status" "ClinicRegistrationStatus" NOT NULL DEFAULT 'PENDING',
    "holdExpiresAt" TIMESTAMP(3),
    "stripeCheckoutSessionId" TEXT,
    "stripePaymentIntentId" TEXT,
    "paidAt" TIMESTAMP(3),
    "refundedAt" TIMESTAMP(3),
    "clientIp" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ClinicRegistration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ClinicRegistrationDay" (
    "id" TEXT NOT NULL,
    "registrationId" TEXT NOT NULL,
    "clinicDayId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ClinicRegistrationDay_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Clinic_slug_key" ON "Clinic"("slug");

-- CreateIndex
CREATE INDEX "Clinic_active_closed_idx" ON "Clinic"("active", "closed");

-- CreateIndex
CREATE INDEX "ClinicDay_clinicId_sortOrder_idx" ON "ClinicDay"("clinicId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicDay_clinicId_date_key" ON "ClinicDay"("clinicId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicRegistration_stripeCheckoutSessionId_key" ON "ClinicRegistration"("stripeCheckoutSessionId");

-- CreateIndex
CREATE INDEX "ClinicRegistration_clinicId_status_idx" ON "ClinicRegistration"("clinicId", "status");

-- CreateIndex
CREATE INDEX "ClinicRegistration_parentEmail_idx" ON "ClinicRegistration"("parentEmail");

-- CreateIndex
CREATE INDEX "ClinicRegistration_userId_idx" ON "ClinicRegistration"("userId");

-- CreateIndex
CREATE INDEX "ClinicRegistration_status_holdExpiresAt_idx" ON "ClinicRegistration"("status", "holdExpiresAt");

-- CreateIndex
CREATE INDEX "ClinicRegistrationDay_clinicDayId_idx" ON "ClinicRegistrationDay"("clinicDayId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicRegistrationDay_registrationId_clinicDayId_key" ON "ClinicRegistrationDay"("registrationId", "clinicDayId");

-- CreateIndex
CREATE UNIQUE INDEX "ClinicRegistrationDay_clinicDayId_registrationId_key" ON "ClinicRegistrationDay"("clinicDayId", "registrationId");

-- AddForeignKey
ALTER TABLE "ClinicDay" ADD CONSTRAINT "ClinicDay_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicRegistration" ADD CONSTRAINT "ClinicRegistration_clinicId_fkey" FOREIGN KEY ("clinicId") REFERENCES "Clinic"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicRegistration" ADD CONSTRAINT "ClinicRegistration_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicRegistration" ADD CONSTRAINT "ClinicRegistration_waiverSignatureId_fkey" FOREIGN KEY ("waiverSignatureId") REFERENCES "WaiverSignature"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicRegistrationDay" ADD CONSTRAINT "ClinicRegistrationDay_registrationId_fkey" FOREIGN KEY ("registrationId") REFERENCES "ClinicRegistration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClinicRegistrationDay" ADD CONSTRAINT "ClinicRegistrationDay_clinicDayId_fkey" FOREIGN KEY ("clinicDayId") REFERENCES "ClinicDay"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
