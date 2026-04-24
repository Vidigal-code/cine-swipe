import {
  Inject,
  Injectable,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { CREDIT_REPOSITORY } from '../../domain/credit/interfaces/credit.repository';
import type { ICreditRepository } from '../../domain/credit/interfaces/credit.repository';
import {
  CreditPurchaseOutbox,
  CreditPurchaseOutboxStatus,
} from '../../domain/credit/entities/credit-purchase-outbox.entity';
import {
  PAYMENT_DLQ_CLIENT,
  PAYMENT_QUEUE_CLIENT,
} from '../../infrastructure/messaging/rabbitmq.module';
import { readPositiveIntConfig } from '../../shared/config/env-number.util';
import { ApiLogger } from '../../shared/logger/api-logger';
import { CREDIT_CHECKOUT_FAILED_EVENT } from '../../application/credit/credit.service';
import { isRmqPaymentFlow } from '../../shared/config/platform.config';

const DEFAULT_DISPATCH_BATCH_SIZE = 25;
const DEFAULT_OUTBOX_MAX_ATTEMPTS = 5;
const DEFAULT_OUTBOX_RETRY_DELAY_MS = 2000;
const DEFAULT_PUBLISH_TIMEOUT_MS = 5000;
const DISPATCHER_LOGGER_CONTEXT = 'CreditOutboxDispatcher';

@Injectable()
export class CreditOutboxDispatcher implements OnModuleInit, OnModuleDestroy {
  private dispatcherTimer: NodeJS.Timeout | null = null;
  private isDispatching = false;

  constructor(
    @Inject(CREDIT_REPOSITORY)
    private readonly creditRepository: ICreditRepository,
    @Inject(PAYMENT_QUEUE_CLIENT)
    private readonly rabbitClient: ClientProxy,
    @Inject(PAYMENT_DLQ_CLIENT)
    private readonly deadLetterClient: ClientProxy,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    if (!isRmqPaymentFlow(this.configService)) {
      return;
    }
    const intervalMs = readPositiveIntConfig(
      this.configService,
      'CREDIT_OUTBOX_DISPATCH_INTERVAL_MS',
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
        'CREDIT_OUTBOX_BATCH_SIZE',
        DEFAULT_DISPATCH_BATCH_SIZE,
      );
      const events =
        await this.creditRepository.findOutboxEventsReadyToDispatch(
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

  private async dispatchEvent(event: CreditPurchaseOutbox): Promise<void> {
    try {
      const payload = {
        creditPurchaseId: event.creditPurchaseId,
        ...event.payload,
      };
      await this.publishEvent(event.eventType, payload);
      await this.creditRepository.markOutboxEventAsSent(event.id);
    } catch (error) {
      await this.handleDispatchFailure(event, error);
    }
  }

  private async publishEvent(
    eventType: string,
    payload: Record<string, unknown>,
  ): Promise<void> {
    const publishTimeoutMs = readPositiveIntConfig(
      this.configService,
      'RABBITMQ_PUBLISH_TIMEOUT_MS',
      DEFAULT_PUBLISH_TIMEOUT_MS,
    );
    await firstValueFrom(
      this.rabbitClient
        .emit(eventType, payload)
        .pipe(timeout(publishTimeoutMs)),
    );
  }

  private async handleDispatchFailure(
    event: CreditPurchaseOutbox,
    error: unknown,
  ): Promise<void> {
    const nextAttempts = event.attempts + 1;
    const maxAttempts = readPositiveIntConfig(
      this.configService,
      'CREDIT_OUTBOX_MAX_ATTEMPTS',
      DEFAULT_OUTBOX_MAX_ATTEMPTS,
    );
    const shouldRetry = nextAttempts < maxAttempts;
    const retryDelayMs = this.getRetryDelayMs(nextAttempts);
    const nextAttemptAt = shouldRetry
      ? new Date(Date.now() + retryDelayMs)
      : null;
    const errorMessage =
      error instanceof Error ? error.message : 'credit outbox dispatch error';

    await this.creditRepository.markOutboxEventForRetry(
      event.id,
      CreditPurchaseOutboxStatus.FAILED,
      nextAttempts,
      nextAttemptAt,
      errorMessage,
    );

    if (!shouldRetry) {
      await this.publishOutboxFailureToDlq(event, errorMessage, nextAttempts);
    }

    ApiLogger.warn(
      `Credit outbox dispatch falhou eventId=${event.id} purchaseId=${event.creditPurchaseId} attempts=${nextAttempts} retry=${shouldRetry}`,
      DISPATCHER_LOGGER_CONTEXT,
    );
  }

  private getRetryDelayMs(attempts: number): number {
    const baseDelayMs = readPositiveIntConfig(
      this.configService,
      'CREDIT_OUTBOX_RETRY_DELAY_MS',
      DEFAULT_OUTBOX_RETRY_DELAY_MS,
    );
    return baseDelayMs * attempts;
  }

  private async publishOutboxFailureToDlq(
    event: CreditPurchaseOutbox,
    errorMessage: string,
    attempts: number,
  ): Promise<void> {
    const publishTimeoutMs = readPositiveIntConfig(
      this.configService,
      'RABBITMQ_PUBLISH_TIMEOUT_MS',
      DEFAULT_PUBLISH_TIMEOUT_MS,
    );
    await firstValueFrom(
      this.deadLetterClient
        .emit(CREDIT_CHECKOUT_FAILED_EVENT, {
          creditPurchaseId: event.creditPurchaseId,
          outboxEventId: event.id,
          reason: 'credit_outbox_max_attempts_exhausted',
          attempts,
          errorMessage,
          eventType: event.eventType,
          payload: event.payload,
        })
        .pipe(timeout(publishTimeoutMs)),
    );
  }
}
