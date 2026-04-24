import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PURCHASE_REPOSITORY } from '../../domain/payment/interfaces/purchase.repository';
import type { IPurchaseRepository } from '../../domain/payment/interfaces/purchase.repository';
import {
  Purchase,
  PurchaseStatus,
} from '../../domain/payment/entities/purchase.entity';
import { MovieService } from '../movie/movie.service';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import {
  PAYMENT_DLQ_CLIENT,
  PAYMENT_QUEUE_CLIENT,
} from '../../infrastructure/messaging/rabbitmq.module';
import { Movie } from '../../domain/movie/entities/movie.entity';
import { PaginationService } from '../../shared/pagination/pagination.service';
import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../shared/pagination/pagination.types';
import { firstValueFrom, timeout } from 'rxjs';
import { StripeWebhookService } from '../../infrastructure/payment/stripe-webhook.service';
import type Stripe from 'stripe';
import { ApiLogger } from '../../shared/logger/api-logger';
import { PaymentAuditService } from './payment-audit.service';
import { readPositiveIntConfig } from '../../shared/config/env-number.util';
import {
  PaymentAuditEventType,
  PaymentAuditSource,
} from '../../domain/payment/entities/payment-audit.entity';

interface CheckoutEvent {
  purchaseId: string;
  amount: number;
  provider: string;
  correlationId: string;
  retryCount: number;
}

export const CHECKOUT_REQUESTED_EVENT = 'checkout.requested';
export const CHECKOUT_FAILED_EVENT = 'checkout.failed';
const DEFAULT_PUBLISH_TIMEOUT_MS = 5000;
const PAYMENT_LOGGER_CONTEXT = 'PaymentService';
const CHECKOUT_CREATED_AUDIT_MESSAGE =
  'Checkout criado e enviado para fila de processamento';

@Injectable()
export class PaymentService {
  private readonly processedWebhookEvents = new Set<string>();

  constructor(
    @Inject(PURCHASE_REPOSITORY)
    private readonly purchaseRepository: IPurchaseRepository,
    @Inject(PAYMENT_QUEUE_CLIENT)
    private readonly rabbitClient: ClientProxy,
    @Inject(PAYMENT_DLQ_CLIENT)
    private readonly deadLetterClient: ClientProxy,
    private readonly movieService: MovieService,
    private readonly configService: ConfigService,
    private readonly paginationService: PaginationService,
    private readonly stripeWebhookService: StripeWebhookService,
    private readonly paymentAuditService: PaymentAuditService,
  ) {}

  async checkout(userId: string, movieId: string): Promise<Purchase> {
    const movie = await this.movieService.getMovieById(movieId);
    const correlationId = randomUUID();
    const provider = this.configService.get<string>('PAYMENT_PROVIDER', 'mock');

    const purchase = await this.purchaseRepository.createWithOutbox(
      {
        userId,
        movieId,
        amount: movie.price,
        status: PurchaseStatus.PENDING,
        provider,
        correlationId,
      },
      {
        eventType: CHECKOUT_REQUESTED_EVENT,
        payload: {
          amount: movie.price,
          provider,
          correlationId,
          retryCount: 0,
        },
      },
    );

    await this.paymentAuditService.captureFromPurchase(
      purchase,
      PaymentAuditEventType.CHECKOUT_REQUESTED,
      PaymentAuditSource.API,
      CHECKOUT_CREATED_AUDIT_MESSAGE,
    );

    return purchase;
  }

  async requeueCheckout(
    payload: Omit<CheckoutEvent, 'retryCount'> & { retryCount: number },
  ): Promise<void> {
    const publishTimeoutMs = readPositiveIntConfig(
      this.configService,
      'RABBITMQ_PUBLISH_TIMEOUT_MS',
      DEFAULT_PUBLISH_TIMEOUT_MS,
    );
    await firstValueFrom(
      this.rabbitClient
        .emit(CHECKOUT_REQUESTED_EVENT, payload)
        .pipe(timeout(publishTimeoutMs)),
    );
    ApiLogger.log(
      `Checkout requeued purchaseId=${payload.purchaseId} retry=${payload.retryCount} correlationId=${payload.correlationId}`,
      PAYMENT_LOGGER_CONTEXT,
    );
  }

  async getUserPurchases(userId: string): Promise<Purchase[]> {
    return this.purchaseRepository.findByUser(userId);
  }

  async getUserMoviesPage(
    userId: string,
    paginationQuery: PaginationQueryInput,
  ): Promise<PaginatedResult<Movie>> {
    const paginationParams = this.paginationService.resolve(paginationQuery);
    const { items, total } = await this.purchaseRepository.findByUserPage(
      userId,
      paginationParams,
      PurchaseStatus.COMPLETED,
    );
    const movies = items
      .map((purchase) => purchase.movie)
      .filter((movie): movie is Movie => Boolean(movie));

    return this.paginationService.buildResult(movies, total, paginationParams);
  }

  async handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void> {
    const event = this.stripeWebhookService.constructEvent(rawBody, signature);
    if (this.isWebhookEventProcessed(event.id)) {
      ApiLogger.debug(
        `Skipping duplicate Stripe event ${event.id}`,
        PAYMENT_LOGGER_CONTEXT,
      );
      await this.recordWebhookDuplicateAudit(event);
      return;
    }

    await this.processStripeEvent(event);
    this.processedWebhookEvents.add(event.id);
  }

  private async processStripeEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentIntentSucceeded(event);
        return;
      case 'payment_intent.payment_failed':
        await this.handlePaymentIntentFailed(event);
        return;
      default:
        ApiLogger.debug(
          `Ignoring unsupported Stripe event ${event.type}`,
          PAYMENT_LOGGER_CONTEXT,
        );
    }
  }

  private async handlePaymentIntentSucceeded(
    event: Stripe.Event,
  ): Promise<void> {
    const metadata = this.extractPaymentIntentMetadata(event);
    const purchase = metadata.purchaseId
      ? await this.purchaseRepository.findById(metadata.purchaseId)
      : metadata.correlationId
        ? await this.purchaseRepository.findByCorrelationId(
            metadata.correlationId,
          )
        : null;

    if (!purchase) {
      ApiLogger.warn(
        `Stripe success webhook without matching purchase. event=${event.id}`,
        PAYMENT_LOGGER_CONTEXT,
      );
      return;
    }

    if (purchase.status === PurchaseStatus.COMPLETED) {
      return;
    }

    await this.updatePurchaseStatusWithAudit(
      purchase.id,
      PurchaseStatus.COMPLETED,
      PaymentAuditSource.WEBHOOK,
      `Stripe event ${event.id} approved payment intent`,
    );
  }

  private async handlePaymentIntentFailed(event: Stripe.Event): Promise<void> {
    const metadata = this.extractPaymentIntentMetadata(event);
    const purchase = metadata.purchaseId
      ? await this.purchaseRepository.findById(metadata.purchaseId)
      : metadata.correlationId
        ? await this.purchaseRepository.findByCorrelationId(
            metadata.correlationId,
          )
        : null;

    if (!purchase) {
      ApiLogger.warn(
        `Stripe failed webhook without matching purchase. event=${event.id}`,
        PAYMENT_LOGGER_CONTEXT,
      );
      return;
    }

    if (purchase.status === PurchaseStatus.COMPLETED) {
      ApiLogger.warn(
        `Ignoring failed webhook for already completed purchase=${purchase.id}`,
        PAYMENT_LOGGER_CONTEXT,
      );
      return;
    }

    await this.updatePurchaseStatusWithAudit(
      purchase.id,
      PurchaseStatus.FAILED,
      PaymentAuditSource.WEBHOOK,
      `Stripe event ${event.id} reported payment failure`,
    );
  }

  private extractPaymentIntentMetadata(event: Stripe.Event): {
    purchaseId?: string;
    correlationId?: string;
  } {
    const intent = event.data.object as Stripe.PaymentIntent;
    return {
      purchaseId: intent.metadata?.purchaseId,
      correlationId: intent.metadata?.correlationId,
    };
  }

  private isWebhookEventProcessed(eventId: string): boolean {
    return this.processedWebhookEvents.has(eventId);
  }

  async updatePurchaseStatusWithAudit(
    purchaseId: string,
    status: PurchaseStatus,
    source: PaymentAuditSource,
    message?: string,
  ): Promise<Purchase | null> {
    const currentPurchase = await this.purchaseRepository.findById(purchaseId);
    if (!currentPurchase) {
      return null;
    }

    const purchase =
      currentPurchase.status === status
        ? currentPurchase
        : await this.purchaseRepository.updateStatus(purchaseId, status);

    await this.paymentAuditService.captureFromPurchase(
      purchase,
      PaymentAuditEventType.STATUS_UPDATED,
      source,
      message,
    );

    return purchase;
  }

  async recordRetryScheduledAudit(
    purchaseId: string,
    retryCount: number,
  ): Promise<void> {
    await this.recordAuditByPurchaseId(
      purchaseId,
      PaymentAuditEventType.RETRY_SCHEDULED,
      PaymentAuditSource.WORKER,
      `Pagamento reagendado para tentativa ${retryCount}`,
    );
  }

  async recordDlqMovedAudit(purchaseId: string, reason: string): Promise<void> {
    await this.recordAuditByPurchaseId(
      purchaseId,
      PaymentAuditEventType.DLQ_MOVED,
      PaymentAuditSource.WORKER,
      `Pagamento movido para DLQ: ${reason}`,
    );
  }

  async sendToDeadLetterQueue(
    payload: CheckoutEvent,
    reason: string,
  ): Promise<void> {
    const publishTimeoutMs = readPositiveIntConfig(
      this.configService,
      'RABBITMQ_PUBLISH_TIMEOUT_MS',
      DEFAULT_PUBLISH_TIMEOUT_MS,
    );
    const deadLetterPayload = {
      ...payload,
      reason,
      failedAt: new Date().toISOString(),
    };
    await firstValueFrom(
      this.deadLetterClient
        .emit(CHECKOUT_FAILED_EVENT, deadLetterPayload)
        .pipe(timeout(publishTimeoutMs)),
    );
    ApiLogger.warn(
      `Checkout moved to DLQ purchaseId=${payload.purchaseId} reason=${reason} correlationId=${payload.correlationId}`,
      PAYMENT_LOGGER_CONTEXT,
    );
  }

  private async recordWebhookDuplicateAudit(
    event: Stripe.Event,
  ): Promise<void> {
    const metadata = this.extractPaymentIntentMetadata(event);
    const purchase = metadata.purchaseId
      ? await this.purchaseRepository.findById(metadata.purchaseId)
      : metadata.correlationId
        ? await this.purchaseRepository.findByCorrelationId(
            metadata.correlationId,
          )
        : null;

    if (!purchase) {
      return;
    }

    await this.paymentAuditService.captureFromPurchase(
      purchase,
      PaymentAuditEventType.WEBHOOK_DUPLICATE_IGNORED,
      PaymentAuditSource.WEBHOOK,
      `Evento duplicado ignorado: ${event.id}`,
    );
  }

  private async recordAuditByPurchaseId(
    purchaseId: string,
    eventType: PaymentAuditEventType,
    source: PaymentAuditSource,
    message: string,
  ): Promise<void> {
    const purchase = await this.purchaseRepository.findById(purchaseId);
    if (!purchase) {
      return;
    }

    await this.paymentAuditService.captureFromPurchase(
      purchase,
      eventType,
      source,
      message,
    );
  }
}
