import { ClientProxy } from '@nestjs/microservices';
import type { IPurchaseRepository } from '../../domain/payment/interfaces/purchase.repository';
import { Purchase, PurchaseStatus } from '../../domain/payment/entities/purchase.entity';
import { MovieService } from '../movie/movie.service';
import { ConfigService } from '@nestjs/config';
import { Movie } from '../../domain/movie/entities/movie.entity';
import { PaginationService } from '../../shared/pagination/pagination.service';
import { PaginatedResult, PaginationQueryInput } from '../../shared/pagination/pagination.types';
import { StripeWebhookService } from '../../infrastructure/payment/stripe-webhook.service';
import { PaymentAuditService } from './payment-audit.service';
import { PaymentAuditSource } from '../../domain/payment/entities/payment-audit.entity';
interface CheckoutEvent {
    purchaseId: string;
    amount: number;
    provider: string;
    correlationId: string;
    retryCount: number;
}
export declare const CHECKOUT_REQUESTED_EVENT = "checkout.requested";
export declare const CHECKOUT_FAILED_EVENT = "checkout.failed";
export declare class PaymentService {
    private readonly purchaseRepository;
    private readonly rabbitClient;
    private readonly deadLetterClient;
    private readonly movieService;
    private readonly configService;
    private readonly paginationService;
    private readonly stripeWebhookService;
    private readonly paymentAuditService;
    private readonly processedWebhookEvents;
    constructor(purchaseRepository: IPurchaseRepository, rabbitClient: ClientProxy, deadLetterClient: ClientProxy, movieService: MovieService, configService: ConfigService, paginationService: PaginationService, stripeWebhookService: StripeWebhookService, paymentAuditService: PaymentAuditService);
    checkout(userId: string, movieId: string): Promise<Purchase>;
    requeueCheckout(payload: Omit<CheckoutEvent, 'retryCount'> & {
        retryCount: number;
    }): Promise<void>;
    getUserPurchases(userId: string): Promise<Purchase[]>;
    getUserMoviesPage(userId: string, paginationQuery: PaginationQueryInput): Promise<PaginatedResult<Movie>>;
    handleStripeWebhook(rawBody: Buffer, signature: string): Promise<void>;
    private processStripeEvent;
    private handlePaymentIntentSucceeded;
    private handlePaymentIntentFailed;
    private extractPaymentIntentMetadata;
    private isWebhookEventProcessed;
    updatePurchaseStatusWithAudit(purchaseId: string, status: PurchaseStatus, source: PaymentAuditSource, message?: string): Promise<Purchase | null>;
    recordRetryScheduledAudit(purchaseId: string, retryCount: number): Promise<void>;
    recordDlqMovedAudit(purchaseId: string, reason: string): Promise<void>;
    sendToDeadLetterQueue(payload: CheckoutEvent, reason: string): Promise<void>;
    private recordWebhookDuplicateAudit;
    private recordAuditByPurchaseId;
}
export {};
