CREATE TABLE "processed_webhook_events" (
    "id" UUID NOT NULL,
    "eventId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "processed_webhook_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "processed_webhook_events_eventId_key"
ON "processed_webhook_events"("eventId");

CREATE INDEX "processed_webhook_events_createdAt_idx"
ON "processed_webhook_events"("createdAt" DESC);
