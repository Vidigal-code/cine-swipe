import { Controller, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import { PaymentGatewayFactory } from '../../infrastructure/payment/payment-gateway.factory';
import { readPositiveIntConfig } from '../../shared/config/env-number.util';
import { ApiLogger } from '../../shared/logger/api-logger';
import {
  CREDIT_CHECKOUT_FAILED_EVENT,
  CREDIT_CHECKOUT_REQUESTED_EVENT,
  CreditService,
} from '../../application/credit/credit.service';
import { CreditPurchaseStatus } from '../../domain/credit/entities/credit-purchase.entity';
import {
  PAYMENT_DLQ_CLIENT,
  PAYMENT_QUEUE_CLIENT,
} from '../../infrastructure/messaging/rabbitmq.module';
import { ClientProxy } from '@nestjs/microservices';

interface CreditCheckoutRequestedEvent {
  creditPurchaseId: string;
  amountBrl: number;
  creditsAmount: number;
  provider: string;
  correlationId: string;
  retryCount: number;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_CURRENCY = 'brl';
const DEFAULT_PUBLISH_TIMEOUT_MS = 5000;
const WORKER_LOGGER_CONTEXT = 'CreditPaymentWorker';

@Controller()
export class CreditPaymentWorker {
  constructor(
    private readonly creditService: CreditService,
    private readonly paymentGatewayFactory: PaymentGatewayFactory,
    private readonly configService: ConfigService,
    @Inject(PAYMENT_QUEUE_CLIENT)
    private readonly rabbitClient: ClientProxy,
    @Inject(PAYMENT_DLQ_CLIENT)
    private readonly deadLetterClient: ClientProxy,
  ) {}

  @EventPattern(CREDIT_CHECKOUT_REQUESTED_EVENT)
  async handleProcessCreditPayment(
    @Payload() event: CreditCheckoutRequestedEvent,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef();
    const message = context.getMessage();
    const maxRetries = readPositiveIntConfig(
      this.configService,
      'CREDIT_PAYMENT_MAX_RETRIES',
      DEFAULT_MAX_RETRIES,
    );

    try {
      const purchase = await this.creditService.markCheckoutLookup(
        event.creditPurchaseId,
      );
      if (!purchase) {
        ApiLogger.warn(
          `Credit purchase nao encontrada id=${event.creditPurchaseId}`,
          WORKER_LOGGER_CONTEXT,
        );
        channel.ack(message);
        return;
      }

      if (purchase.status !== CreditPurchaseStatus.PENDING) {
        channel.ack(message);
        return;
      }

      const gateway = this.paymentGatewayFactory.resolveGateway(event.provider);
      const result = await gateway.processPayment({
        purchaseId: event.creditPurchaseId,
        amount: event.amountBrl,
        correlationId: event.correlationId,
        currency: this.configService.get<string>(
          'STRIPE_CURRENCY',
          DEFAULT_CURRENCY,
        ),
        purchaseKind: 'credit',
      });

      if (result.approved) {
        await this.creditService.markCheckoutCompleted(
          event.creditPurchaseId,
          result.externalReference,
        );
        channel.ack(message);
        return;
      }

      if (this.shouldRetry(event.retryCount, maxRetries)) {
        await this.requeue(event);
      } else {
        await this.creditService.markCheckoutFailed(
          event.creditPurchaseId,
          result.failureReason ?? 'gateway_declined_after_max_retries',
          result.externalReference,
        );
        await this.sendToDlq(event, 'gateway_declined_after_max_retries');
      }

      channel.ack(message);
    } catch (error) {
      ApiLogger.error(
        `Falha no processamento de creditPurchase=${event.creditPurchaseId}: ${error instanceof Error ? error.message : 'unknown'}`,
        WORKER_LOGGER_CONTEXT,
      );

      if (this.shouldRetry(event.retryCount, maxRetries)) {
        await this.requeue(event);
      } else {
        await this.creditService.markCheckoutFailed(
          event.creditPurchaseId,
          'gateway_exception_after_max_retries',
        );
        await this.sendToDlq(event, 'gateway_exception_after_max_retries');
      }

      channel.ack(message);
    }
  }

  private shouldRetry(retryCount: number, maxRetries: number): boolean {
    return retryCount < maxRetries;
  }

  private async requeue(event: CreditCheckoutRequestedEvent): Promise<void> {
    const publishTimeoutMs = readPositiveIntConfig(
      this.configService,
      'RABBITMQ_PUBLISH_TIMEOUT_MS',
      DEFAULT_PUBLISH_TIMEOUT_MS,
    );
    await firstValueFrom(
      this.rabbitClient
        .emit(CREDIT_CHECKOUT_REQUESTED_EVENT, {
          ...event,
          retryCount: event.retryCount + 1,
        })
        .pipe(timeout(publishTimeoutMs)),
    );
  }

  private async sendToDlq(
    event: CreditCheckoutRequestedEvent,
    reason: string,
  ): Promise<void> {
    const publishTimeoutMs = readPositiveIntConfig(
      this.configService,
      'RABBITMQ_PUBLISH_TIMEOUT_MS',
      DEFAULT_PUBLISH_TIMEOUT_MS,
    );
    await firstValueFrom(
      this.deadLetterClient
        .emit(CREDIT_CHECKOUT_FAILED_EVENT, {
          ...event,
          reason,
          failedAt: new Date().toISOString(),
        })
        .pipe(timeout(publishTimeoutMs)),
    );
  }
}
