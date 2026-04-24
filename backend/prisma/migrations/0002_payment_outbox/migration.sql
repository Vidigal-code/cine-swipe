-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PaymentOutboxStatus') THEN
    CREATE TYPE "PaymentOutboxStatus" AS ENUM ('PENDING', 'SENT', 'FAILED');
  END IF;
END
$$;

-- CreateTable
CREATE TABLE IF NOT EXISTS "payment_outbox" (
    "id" UUID NOT NULL,
    "purchaseId" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "PaymentOutboxStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3),
    "lastError" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_outbox_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_outbox_purchaseId_idx" ON "payment_outbox"("purchaseId");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "payment_outbox_status_nextAttemptAt_createdAt_idx"
ON "payment_outbox"("status", "nextAttemptAt", "createdAt");

-- AddForeignKey
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'payment_outbox_purchaseId_fkey'
  ) THEN
    ALTER TABLE "payment_outbox"
    ADD CONSTRAINT "payment_outbox_purchaseId_fkey"
    FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
