-- AlterTable
ALTER TABLE "MentalGameSubmission" ADD COLUMN "recommendedDrills" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "SwingAnalysisSubmission" ADD COLUMN "recommendedDrills" TEXT[] DEFAULT ARRAY[]::TEXT[];
