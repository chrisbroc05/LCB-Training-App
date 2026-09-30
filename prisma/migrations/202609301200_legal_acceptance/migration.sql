-- AlterTable
ALTER TABLE "User" ADD COLUMN     "termsVersion" TEXT,
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3),
ADD COLUMN     "acceptedByName" TEXT,
ADD COLUMN     "acceptedAsParent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mediaConsent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "mediaConsentUpdatedAt" TIMESTAMP(3);
