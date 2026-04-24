-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CreditPurchaseStatus') THEN
    CREATE TYPE "CreditPurchaseStatus" AS ENUM ('PENDING', 'COMPLETED', 'FAILED');
  END IF;
END
$$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'CreditTransactionType') THEN
    CREATE TYPE "CreditTransactionType" AS ENUM (
      'REGISTRATION_BONUS',
      'REFEREE_REGISTRATION_BONUS',
      'REFERRER_FIRST_PURCHASE_BONUS',
      'CREDIT_PURCHASE',
      'CREDIT_CONSUMPTION',
      'ADMIN_ADJUSTMENT'
    );
  END IF;
END
$$;

-- CreateEnum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ReferralRewardType') THEN
    CREATE TYPE "ReferralRewardType" AS ENUM ('REFEREE_REGISTRATION', 'REFERRER_FIRST_PURCHASE');
  END IF;
END
$$;

-- AlterTable users: add credit/referral/profile columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'creditsBalance'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "creditsBalance" INTEGER NOT NULL DEFAULT 0;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatarUrl'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "avatarUrl" TEXT;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'referralCode'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "referralCode" TEXT;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'referredByUserId'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "referredByUserId" UUID;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'firstApprovedCreditPurchaseDone'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "firstApprovedCreditPurchaseDone" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'referralSignupBonusGranted'
  ) THEN
    ALTER TABLE "users" ADD COLUMN "referralSignupBonusGranted" BOOLEAN NOT NULL DEFAULT false;
  END IF;
END
$$;

-- Backfill referralCode for existing rows
UPDATE "users"
SET "referralCode" = CONCAT('ref_', SUBSTRING(REPLACE("id"::text, '-', '') FROM 1 FOR 20))
WHERE "referralCode" IS NULL OR LENGTH(TRIM("referralCode")) = 0;

-- Enforce referralCode constraints
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'users'
      AND column_name = 'referralCode'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE "users" ALTER COLUMN "referralCode" SET NOT NULL;
  END IF;
END
$$;

-- User indexes and self-reference FK
CREATE UNIQUE INDEX IF NOT EXISTS "users_referralCode_key" ON "users"("referralCode");
CREATE INDEX IF NOT EXISTS "users_referredByUserId_idx" ON "users"("referredByUserId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_referredByUserId_fkey'
  ) THEN
    ALTER TABLE "users"
      ADD CONSTRAINT "users_referredByUserId_fkey"
      FOREIGN KEY ("referredByUserId") REFERENCES "users"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END
$$;

-- CreateTable credit_plans
CREATE TABLE IF NOT EXISTS "credit_plans" (
  "id" UUID NOT NULL,
  "name" TEXT NOT NULL,
  "creditsAmount" INTEGER NOT NULL,
  "priceBrl" DECIMAL(10,2) NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "credit_plans_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "credit_plans_name_key" ON "credit_plans"("name");
CREATE INDEX IF NOT EXISTS "credit_plans_isActive_createdAt_idx" ON "credit_plans"("isActive", "createdAt" DESC);

-- CreateTable credit_system_config (singleton id=1)
CREATE TABLE IF NOT EXISTS "credit_system_config" (
  "id" INTEGER NOT NULL,
  "registrationBonusCredits" INTEGER NOT NULL DEFAULT 250,
  "referralEnabled" BOOLEAN NOT NULL DEFAULT true,
  "refereeRegistrationBonusCredits" INTEGER NOT NULL DEFAULT 0,
  "referrerFirstPurchaseBonusCredits" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "credit_system_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable credit_transactions
CREATE TABLE IF NOT EXISTS "credit_transactions" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "type" "CreditTransactionType" NOT NULL,
  "amount" INTEGER NOT NULL,
  "balanceBefore" INTEGER NOT NULL,
  "balanceAfter" INTEGER NOT NULL,
  "description" TEXT,
  "correlationId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "credit_transactions_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "credit_transactions_userId_createdAt_idx" ON "credit_transactions"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "credit_transactions_type_idx" ON "credit_transactions"("type");
CREATE UNIQUE INDEX IF NOT EXISTS "credit_transactions_userId_correlationId_key"
  ON "credit_transactions"("userId", "correlationId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credit_transactions_userId_fkey'
  ) THEN
    ALTER TABLE "credit_transactions"
      ADD CONSTRAINT "credit_transactions_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- CreateTable credit_purchases
CREATE TABLE IF NOT EXISTS "credit_purchases" (
  "id" UUID NOT NULL,
  "userId" UUID NOT NULL,
  "creditPlanId" UUID NOT NULL,
  "creditsAmount" INTEGER NOT NULL,
  "amountBrl" DECIMAL(10,2) NOT NULL,
  "status" "CreditPurchaseStatus" NOT NULL DEFAULT 'PENDING',
  "provider" TEXT NOT NULL,
  "correlationId" UUID NOT NULL,
  "stripePaymentIntentId" TEXT,
  "failureReason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "credit_purchases_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "credit_purchases_correlationId_key" ON "credit_purchases"("correlationId");
CREATE INDEX IF NOT EXISTS "credit_purchases_userId_createdAt_idx" ON "credit_purchases"("userId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "credit_purchases_creditPlanId_idx" ON "credit_purchases"("creditPlanId");
CREATE INDEX IF NOT EXISTS "credit_purchases_status_idx" ON "credit_purchases"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credit_purchases_userId_fkey'
  ) THEN
    ALTER TABLE "credit_purchases"
      ADD CONSTRAINT "credit_purchases_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credit_purchases_creditPlanId_fkey'
  ) THEN
    ALTER TABLE "credit_purchases"
      ADD CONSTRAINT "credit_purchases_creditPlanId_fkey"
      FOREIGN KEY ("creditPlanId") REFERENCES "credit_plans"("id")
      ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END
$$;

-- CreateTable credit_purchase_outbox
CREATE TABLE IF NOT EXISTS "credit_purchase_outbox" (
  "id" UUID NOT NULL,
  "creditPurchaseId" UUID NOT NULL,
  "eventType" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "PaymentOutboxStatus" NOT NULL DEFAULT 'PENDING',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "nextAttemptAt" TIMESTAMP(3),
  "lastError" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "credit_purchase_outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "credit_purchase_outbox_creditPurchaseId_idx" ON "credit_purchase_outbox"("creditPurchaseId");
CREATE INDEX IF NOT EXISTS "credit_purchase_outbox_status_nextAttemptAt_createdAt_idx"
  ON "credit_purchase_outbox"("status", "nextAttemptAt", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'credit_purchase_outbox_creditPurchaseId_fkey'
  ) THEN
    ALTER TABLE "credit_purchase_outbox"
      ADD CONSTRAINT "credit_purchase_outbox_creditPurchaseId_fkey"
      FOREIGN KEY ("creditPurchaseId") REFERENCES "credit_purchases"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

-- CreateTable referral_reward_logs
CREATE TABLE IF NOT EXISTS "referral_reward_logs" (
  "id" UUID NOT NULL,
  "referrerUserId" UUID NOT NULL,
  "refereeUserId" UUID NOT NULL,
  "rewardType" "ReferralRewardType" NOT NULL,
  "creditsGranted" INTEGER NOT NULL,
  "correlationId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "referral_reward_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "referral_reward_logs_referrerUserId_createdAt_idx"
  ON "referral_reward_logs"("referrerUserId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "referral_reward_logs_refereeUserId_createdAt_idx"
  ON "referral_reward_logs"("refereeUserId", "createdAt" DESC);
CREATE UNIQUE INDEX IF NOT EXISTS "referral_reward_logs_refereeUserId_rewardType_key"
  ON "referral_reward_logs"("refereeUserId", "rewardType");
CREATE UNIQUE INDEX IF NOT EXISTS "referral_reward_logs_referrerUserId_refereeUserId_rewardType_key"
  ON "referral_reward_logs"("referrerUserId", "refereeUserId", "rewardType");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'referral_reward_logs_referrerUserId_fkey'
  ) THEN
    ALTER TABLE "referral_reward_logs"
      ADD CONSTRAINT "referral_reward_logs_referrerUserId_fkey"
      FOREIGN KEY ("referrerUserId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'referral_reward_logs_refereeUserId_fkey'
  ) THEN
    ALTER TABLE "referral_reward_logs"
      ADD CONSTRAINT "referral_reward_logs_refereeUserId_fkey"
      FOREIGN KEY ("refereeUserId") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;
