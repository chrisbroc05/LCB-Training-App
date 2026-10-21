-- CreateEnum
CREATE TYPE "LeadRole" AS ENUM ('PLAYER', 'PARENT', 'COACH');

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "role" "LeadRole" NOT NULL,
    "source" TEXT NOT NULL,
    "firstResourceSlug" TEXT,
    "isBuyer" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "unsubscribedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadResource" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "resourceSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadResource_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeadEmailLog" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "dedupeKey" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LeadEmailLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResourcePurchase" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "resourceSlug" TEXT NOT NULL,
    "stripeSessionId" TEXT NOT NULL,
    "amountCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ResourcePurchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RemoteSessionPurchase" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "stripeSessionId" TEXT NOT NULL,
    "amountCents" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RemoteSessionPurchase_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lead_email_key" ON "Lead"("email");

-- CreateIndex
CREATE INDEX "Lead_source_idx" ON "Lead"("source");

-- CreateIndex
CREATE INDEX "Lead_role_idx" ON "Lead"("role");

-- CreateIndex
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt" DESC);

-- CreateIndex
CREATE INDEX "LeadResource_leadId_idx" ON "LeadResource"("leadId");

-- CreateIndex
CREATE INDEX "LeadResource_resourceSlug_idx" ON "LeadResource"("resourceSlug");

-- CreateIndex
CREATE UNIQUE INDEX "LeadEmailLog_dedupeKey_key" ON "LeadEmailLog"("dedupeKey");

-- CreateIndex
CREATE INDEX "LeadEmailLog_leadId_type_idx" ON "LeadEmailLog"("leadId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "ResourcePurchase_stripeSessionId_key" ON "ResourcePurchase"("stripeSessionId");

-- CreateIndex
CREATE INDEX "ResourcePurchase_email_idx" ON "ResourcePurchase"("email");

-- CreateIndex
CREATE INDEX "ResourcePurchase_userId_idx" ON "ResourcePurchase"("userId");

-- CreateIndex
CREATE INDEX "ResourcePurchase_resourceSlug_idx" ON "ResourcePurchase"("resourceSlug");

-- CreateIndex
CREATE UNIQUE INDEX "RemoteSessionPurchase_stripeSessionId_key" ON "RemoteSessionPurchase"("stripeSessionId");

-- CreateIndex
CREATE INDEX "RemoteSessionPurchase_email_idx" ON "RemoteSessionPurchase"("email");

-- CreateIndex
CREATE INDEX "RemoteSessionPurchase_userId_idx" ON "RemoteSessionPurchase"("userId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadResource" ADD CONSTRAINT "LeadResource_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeadEmailLog" ADD CONSTRAINT "LeadEmailLog_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourcePurchase" ADD CONSTRAINT "ResourcePurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RemoteSessionPurchase" ADD CONSTRAINT "RemoteSessionPurchase_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
