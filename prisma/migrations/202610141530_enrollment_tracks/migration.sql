-- CreateTable
CREATE TABLE "EnrollmentTrack" (
    "id" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "trackKey" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" VARCHAR(500),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrollmentTrack_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EnrollmentTrack_enrollmentId_trackKey_key" ON "EnrollmentTrack"("enrollmentId", "trackKey");

-- CreateIndex
CREATE INDEX "EnrollmentTrack_enrollmentId_idx" ON "EnrollmentTrack"("enrollmentId");

-- AddForeignKey
ALTER TABLE "EnrollmentTrack" ADD CONSTRAINT "EnrollmentTrack_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "ProgramEnrollment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
