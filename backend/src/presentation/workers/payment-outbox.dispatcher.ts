import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import {
  PaymentOutbox,
  PaymentOutboxStatus,
} from '../../domain/payment/entities/payment-outbox.entity';
import { PURCHASE_REPOSITORY } from '../../domain/payment/interfaces/purchase.repository';
import type { IPurchaseRepository } from '../../domain/payment/interfaces/purchase.repository';
import {
  PAYMENT_DLQ_CLIENT,
  PAYMENT_QUEUE_CLIENT,
} from '../../infrastructure/messaging/rabbitmq.module';
import { CHECKOUT_FAILED_EVENT } from '../../application/payment/payment.service';
import { ApiLogger } from '../../shared/logger/api-logger';
import { readPositiveIntConfig } from '../../shared/config/env-number.util';
import { firstValueFrom, timeout } from 'rxjs';

const DEFAULT_DISPATCH_BATCH_SIZE = 25;
const DEFAULT_OUTBOX_MAX_ATTEMPTS = 5;
const DEFAULT_OUTBOX_RETRY_DELAY_MS = 2000;
const DEFAULT_OUTBOX_PUBLISH_TIMEOUT_MS = 5000;
const LOGGER_CONTEXT = 'PaymentOutboxDispatcher';

@Injectable()
export class PaymentOutboxDispatcher implements OnModuleInit, OnModuleDestroy {
  private dispatcherTimer: NodeJS.Timeout | null = null;
  private isDispatching = false;

  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: IPurchaseRepository,
    @Inject(PAYMENT_QUEUE_CLIENT)
    private readonly rabbitClient: ClientProxy,
    @Inject(PAYMENT_DLQ_CLIENT)
    private readonly deadLetterClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    const intervalMs = readPositiveIntConfig(
      this.configService,
      'PAYMENT_OUTBOX_DISPATCH_INTERVAL_MS',
      3000,
    );

    this.dispatcherTimer = setInterval(() => {
      void this.dispatchPendingEvents();
    }, intervalMs);

    void this.dispatchPendingEvents();
  }

  onModuleDestroy(): void {
    if (this.dispatcherTimer) {
      clearInterval(this.dispatcherTimer);
      this.dispatcherTimer = null;
    }
  }

  async dispatchPendingEvents(): Promise<void> {
    if (this.isDispatching) {
      return;
    }

    this.isDispatching = true;
    try {
      const batchSize = readPositiveIntConfig(
        this.configService,
        'PAYMENT_OUTBOX_BATCH_SIZE',
        DEFAULT_DISPATCH_BATCH_SIZE,
      );
      const events =
        await this.purchaseRepository.findOutboxEventsReadyToDispatch(
          batchSize,
          new Date(),
        );

      for (const event of events) {
        await this.dispatchEvent(event);
      }
    } finally {
      this.isDispatching = false;
    }
  }

  private async dispatchEvent(event: PaymentOutbox): Promise<void> {
    try {
      const payload = this.buildPayload(event);
      await this.publishEvent(event.eventType, payload);
      await this.purchaseRepository.markOutboxEventAsSent(event.id);
    } catch (error) {
      await this.handleDispatchFailure(event, error);
    }
  }

  private buildPayload(event: PaymentOutbox): Record<string, unknown> {
    return {
      purchaseId: event.purchaseId,
      ...event.payload,
    };
  }

  private async handleDispatchFailure(
    event: PaymentOutbox,
    error: unknown,
  ): Promise<void> {
    const nextAttempts = event.attempts + 1;
    const maxAttempts = readPositiveIntConfig(
      this.configService,
      'PAYMENT_OUTBOX_MAX_ATTEMPTS',
      DEFAULT_OUTBOX_MAX_ATTEMPTS,
    );
    const shouldRetry = nextAttempts < maxAttempts;
    const retryDelayMs = this.getRetryDelayMs(nextAttempts);
    const nextAttemptAt = shouldRetry
      ? new Date(Date.now() + retryDelayMs)
      : null;
    const errorMessage =
      error instanceof Error ? error.message : 'outbox dispatch error';

    await this.purchaseRepository.markOutboxEventForRetry(
      event.id,
      PaymentOutboxStatus.FAILED,
      nextAttempts,
      nextAttemptAt,
      errorMessage,
    );

    if (!shouldRetry) {
      await this.publishOutboxFailureToDlq(event, errorMessage, nextAttempts);
    }

    ApiLogger.warn(
      `Outbox dispatch failed eventId=${event.id} purchaseId=${event.purchaseId} attempts=${nextAttempts} retry=${shouldRetry} correlationId=${this.extractCorrelationId(event)}`,
      LOGGER_CONTEXT,
    );
  }

  private getRetryDelayMs(attempts: number): number {
    const baseDelayMs = readPositiveIntConfig(
      this.configService,
      'PAYMENT_OUTBOX_RETRY_DELAY_MS',
      DEFAULT_OUTBOX_RETRY_DELAY_MS,
    );
    return baseDelayMs * attempts;
  }

  private async publishEvent(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const publishTimeoutMs = readPositiveIntConfig(
      this.configService,
      'RABBITMQ_PUBLISH_TIMEOUT_MS',
      DEFAULT_OUTBOX_PUBLISH_TIMEOUT_MS,
    );
    await firstValueFrom(
      this.rabbitClient
        .emit(eventType, payload)
        .pipe(timeout(publishTimeoutMs)),
    );
    ApiLogger.debug(
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      `Outbox event published type=${eventType} purchaseId=${String(payload.purchaseId ?? '')} correlationId=${String(payload.correlationId ?? '')}`,
      LOGGER_CONTEXT,
    );
  }

  private async publishOutboxFailureToDlq(
    event: PaymentOutbox,
    errorMessage: string,
    attempts: number,
  ): Promise<void> {
    const payload = {
      purchaseId: event.purchaseId,
      correlationId: this.extractCorrelationId(event),
      outboxEventId: event.id,
      reason: 'outbox_max_attempts_exhausted',
      attempts,
      errorMessage,
      eventType: event.eventType,
      payload: event.payload,
    };

    try {
      const publishTimeoutMs = readPositiveIntConfig(
        this.configService,
        'RABBITMQ_PUBLISH_TIMEOUT_MS',
        DEFAULT_OUTBOX_PUBLISH_TIMEOUT_MS,
      );
      await firstValueFrom(
        this.deadLetterClient
          .emit(CHECKOUT_FAILED_EVENT, payload)
          .pipe(timeout(publishTimeoutMs)),
      );
      ApiLogger.warn(
        `Outbox event moved to DLQ eventId=${event.id} correlationId=${payload.correlationId}`,
        LOGGER_CONTEXT,
      );
    } catch (error) {
      ApiLogger.error(
        `Failed to move outbox event to DLQ eventId=${event.id} correlationId=${payload.correlationId} error=${error instanceof Error ? error.message : 'unknown'}`,
        LOGGER_CONTEXT,
      );
    }
  }

  private extractCorrelationId(event: PaymentOutbox): string {
    const maybeCorrelation = event.payload.correlationId;
    return typeof maybeCorrelation === 'string' ? maybeCorrelation : 'unknown';
  }
}
