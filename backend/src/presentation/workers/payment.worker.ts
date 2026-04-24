import { Controller, Inject } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { PURCHASE_REPOSITORY } from '../../domain/payment/interfaces/purchase.repository';
import type { IPurchaseRepository } from '../../domain/payment/interfaces/purchase.repository';
import { PurchaseStatus } from '../../domain/payment/entities/purchase.entity';
import { PaymentGatewayFactory } from '../../infrastructure/payment/payment-gateway.factory';
import {
  CHECKOUT_REQUESTED_EVENT,
  PaymentService,
} from '../../application/payment/payment.service';
import { ConfigService } from '@nestjs/config';
import { ApiLogger } from '../../shared/logger/api-logger';
import { readPositiveIntConfig } from '../../shared/config/env-number.util';
import { PaymentAuditSource } from '../../domain/payment/entities/payment-audit.entity';

interface CheckoutRequestedEvent {
  purchaseId: string;
  amount: number;
  provider: string;
  correlationId: string;
  retryCount: number;
}

const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_CURRENCY = 'brl';
const LOGGER_CONTEXT = 'PaymentWorker';

@Controller()
export class PaymentWorker {
  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: IPurchaseRepository,
    private readonly paymentGatewayFactory: PaymentGatewayFactory,
    private readonly paymentService: PaymentService,
    private readonly configService: ConfigService,
  ) {}

  @EventPattern(CHECKOUT_REQUESTED_EVENT)
  async handleProcessPayment(
    @Payload() event: CheckoutRequestedEvent,
    @Ctx() context: RmqContext,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const channel = context.getChannelRef();
    const message = context.getMessage();
    const maxRetries = readPositiveIntConfig(
      this.configService,
      'PAYMENT_MAX_RETRIES',
      DEFAULT_MAX_RETRIES,
    );

    try {
      const purchase = await this.purchaseRepository.findById(event.purchaseId);
      if (!purchase) {
        ApiLogger.warn(
          `Purchase not found: ${event.purchaseId}`,
          LOGGER_CONTEXT,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        channel.ack(message);
        return;
      }

      if (purchase.status !== PurchaseStatus.PENDING) {
        ApiLogger.log(
          `Skipping already processed purchase: ${event.purchaseId} (${purchase.status})`,
          LOGGER_CONTEXT,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        channel.ack(message);
        return;
      }

      const gateway = this.paymentGatewayFactory.resolveGateway(event.provider);
      const result = await gateway.processPayment({
        purchaseId: event.purchaseId,
        amount: event.amount,
        correlationId: event.correlationId,
        currency: this.configService.get<string>(
          'STRIPE_CURRENCY',
          DEFAULT_CURRENCY,
        ),
      });

      if (result.approved) {
        await this.paymentService.updatePurchaseStatusWithAudit(
          event.purchaseId,
          PurchaseStatus.COMPLETED,
          PaymentAuditSource.WORKER,
          'Pagamento aprovado no worker assíncrono',
        );
        ApiLogger.log(
          `Payment approved purchaseId=${event.purchaseId} correlationId=${event.correlationId}`,
          LOGGER_CONTEXT,
        );
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        channel.ack(message);
        return;
      }

      if (this.shouldRetry(event.retryCount, maxRetries)) {
        await this.requeueWithNextRetry(event);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        channel.ack(message);
        return;
      }

      await this.paymentService.updatePurchaseStatusWithAudit(
        event.purchaseId,
        PurchaseStatus.FAILED,
        PaymentAuditSource.WORKER,
        'Pagamento recusado após tentativas máximas',
      );
      await this.moveToDlqSafely(event, 'gateway_declined_after_max_retries');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      channel.ack(message);
    } catch (error) {
      ApiLogger.error(
        `Payment processing failed for ${event.purchaseId}: ${error instanceof Error ? error.message : 'unknown'}`,
        LOGGER_CONTEXT,
      );

      if (this.shouldRetry(event.retryCount, maxRetries)) {
        await this.requeueWithNextRetry(event);
      } else {
        await this.paymentService.updatePurchaseStatusWithAudit(
          event.purchaseId,
          PurchaseStatus.FAILED,
          PaymentAuditSource.WORKER,
          'Pagamento falhou por exceção após tentativas máximas',
        );
        await this.moveToDlqSafely(
          event,
          'gateway_exception_after_max_retries',
        );
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      channel.ack(message);
    }
  }

  private shouldRetry(retryCount: number, maxRetries: number): boolean {
    return retryCount < maxRetries;
  }

  private async requeueWithNextRetry(
    event: CheckoutRequestedEvent,
  ): Promise<void> {
    const nextRetry = event.retryCount + 1;
    await this.paymentService.requeueCheckout({
      ...event,
      retryCount: nextRetry,
    });
    await this.paymentService.recordRetryScheduledAudit(
      event.purchaseId,
      nextRetry,
    );
  }

  private async moveToDlqSafely(
    event: CheckoutRequestedEvent,
    reason: string,
  ): Promise<void> {
    try {
      await this.paymentService.sendToDeadLetterQueue(event, reason);
      await this.paymentService.recordDlqMovedAudit(event.purchaseId, reason);
    } catch (error) {
      ApiLogger.error(
        `Failed to move message to DLQ purchaseId=${event.purchaseId} reason=${reason} error=${error instanceof Error ? error.message : 'unknown'}`,
        LOGGER_CONTEXT,
      );
    }
  }
}
