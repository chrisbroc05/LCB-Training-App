-- CreateTable
CREATE TABLE "GoalItem" (
    "id" SERIAL NOT NULL,
    "checkinId" INTEGER NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "targetValue" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoalItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GoalItem_checkinId_idx" ON "GoalItem"("checkinId");

-- AddForeignKey
ALTER TABLE "GoalItem" ADD CONSTRAINT "GoalItem_checkinId_fkey" FOREIGN KEY ("checkinId") REFERENCES "GoalCheckin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
