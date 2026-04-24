-- CreateTable
CREATE TABLE IF NOT EXISTS "payment_audits" (
    "id" UUID NOT NULL,
    "purchaseId" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userName" TEXT NOT NULL,
    "userEmail" TEXT NOT NULL,
    "movieId" UUID NOT NULL,
    "movieTitle" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "provider" TEXT NOT NULL,
    "status" "PurchaseStatus" NOT NULL,
    "correlationId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_audits_createdAt_idx"
ON "payment_audits"("createdAt" DESC);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_audits_purchaseId_idx"
ON "payment_audits"("purchaseId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_audits_userId_idx"
ON "payment_audits"("userId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_audits_movieId_idx"
ON "payment_audits"("movieId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_audits_status_idx"
ON "payment_audits"("status");
