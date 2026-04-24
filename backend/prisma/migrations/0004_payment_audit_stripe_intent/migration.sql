-- AlterTable
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'payment_audits'
      AND column_name = 'stripePaymentIntentId'
  ) THEN
    ALTER TABLE "payment_audits" ADD COLUMN "stripePaymentIntentId" TEXT;
  END IF;
END
$$;
