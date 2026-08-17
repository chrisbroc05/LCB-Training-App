-- CreateTable
CREATE TABLE "PlaybookProgress" (
    "id" SERIAL NOT NULL,
    "userId" TEXT NOT NULL,
    "overallComplete" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "coachNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaybookProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaybookChapter" (
    "id" SERIAL NOT NULL,
    "progressId" INTEGER NOT NULL,
    "chapterNumber" INTEGER NOT NULL,
    "chapterTitle" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "PlaybookChapter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlaybookReflection" (
    "id" SERIAL NOT NULL,
    "chapterId" INTEGER NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "answer" TEXT,
    "sharedWithCoach" BOOLEAN NOT NULL DEFAULT false,
    "sharedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlaybookReflection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PlaybookProgress_userId_key" ON "PlaybookProgress"("userId");

-- CreateIndex
CREATE INDEX "PlaybookChapter_progressId_idx" ON "PlaybookChapter"("progressId");

-- CreateIndex
CREATE UNIQUE INDEX "PlaybookChapter_progressId_chapterNumber_key" ON "PlaybookChapter"("progressId", "chapterNumber");

-- CreateIndex
CREATE INDEX "PlaybookReflection_chapterId_idx" ON "PlaybookReflection"("chapterId");

-- CreateIndex
CREATE INDEX "PlaybookReflection_sharedWithCoach_sharedAt_idx" ON "PlaybookReflection"("sharedWithCoach", "sharedAt");

-- CreateIndex
CREATE UNIQUE INDEX "PlaybookReflection_chapterId_questionNumber_key" ON "PlaybookReflection"("chapterId", "questionNumber");

-- AddForeignKey
ALTER TABLE "PlaybookProgress" ADD CONSTRAINT "PlaybookProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybookChapter" ADD CONSTRAINT "PlaybookChapter_progressId_fkey" FOREIGN KEY ("progressId") REFERENCES "PlaybookProgress"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlaybookReflection" ADD CONSTRAINT "PlaybookReflection_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "PlaybookChapter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
