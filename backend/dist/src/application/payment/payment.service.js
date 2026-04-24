"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentService = exports.CHECKOUT_FAILED_EVENT = exports.CHECKOUT_REQUESTED_EVENT = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const purchase_repository_1 = require("../../domain/payment/interfaces/purchase.repository");
const purchase_entity_1 = require("../../domain/payment/entities/purchase.entity");
const movie_service_1 = require("../movie/movie.service");
const config_1 = require("@nestjs/config");
const crypto_1 = require("crypto");
const rabbitmq_module_1 = require("../../infrastructure/messaging/rabbitmq.module");
const pagination_service_1 = require("../../shared/pagination/pagination.service");
const rxjs_1 = require("rxjs");
const stripe_webhook_service_1 = require("../../infrastructure/payment/stripe-webhook.service");
const api_logger_1 = require("../../shared/logger/api-logger");
const payment_audit_service_1 = require("./payment-audit.service");
const env_number_util_1 = require("../../shared/config/env-number.util");
const payment_audit_entity_1 = require("../../domain/payment/entities/payment-audit.entity");
exports.CHECKOUT_REQUESTED_EVENT = 'checkout.requested';
exports.CHECKOUT_FAILED_EVENT = 'checkout.failed';
const DEFAULT_PUBLISH_TIMEOUT_MS = 5000;
const PAYMENT_LOGGER_CONTEXT = 'PaymentService';
const CHECKOUT_CREATED_AUDIT_MESSAGE = 'Checkout criado e enviado para fila de processamento';
let PaymentService = class PaymentService {
    purchaseRepository;
    rabbitClient;
    deadLetterClient;
    movieService;
    configService;
    paginationService;
    stripeWebhookService;
    paymentAuditService;
    processedWebhookEvents = new Set();
    constructor(purchaseRepository, rabbitClient, deadLetterClient, movieService, configService, paginationService, stripeWebhookService, paymentAuditService) {
        this.purchaseRepository = purchaseRepository;
        this.rabbitClient = rabbitClient;
        this.deadLetterClient = deadLetterClient;
        this.movieService = movieService;
        this.configService = configService;
        this.paginationService = paginationService;
        this.stripeWebhookService = stripeWebhookService;
        this.paymentAuditService = paymentAuditService;
    }
    async checkout(userId, movieId) {
        const movie = await this.movieService.getMovieById(movieId);
        const correlationId = (0, crypto_1.randomUUID)();
        const provider = this.configService.get('PAYMENT_PROVIDER', 'mock');
        const purchase = await this.purchaseRepository.createWithOutbox({
            userId,
            movieId,
            amount: movie.price,
            status: purchase_entity_1.PurchaseStatus.PENDING,
            provider,
            correlationId,
        }, {
            eventType: exports.CHECKOUT_REQUESTED_EVENT,
            payload: {
                amount: movie.price,
                provider,
                correlationId,
                retryCount: 0,
            },
        });
        await this.paymentAuditService.captureFromPurchase(purchase, payment_audit_entity_1.PaymentAuditEventType.CHECKOUT_REQUESTED, payment_audit_entity_1.PaymentAuditSource.API, CHECKOUT_CREATED_AUDIT_MESSAGE);
        return purchase;
    }
    async requeueCheckout(payload) {
        const publishTimeoutMs = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'RABBITMQ_PUBLISH_TIMEOUT_MS', DEFAULT_PUBLISH_TIMEOUT_MS);
        await (0, rxjs_1.firstValueFrom)(this.rabbitClient
            .emit(exports.CHECKOUT_REQUESTED_EVENT, payload)
            .pipe((0, rxjs_1.timeout)(publishTimeoutMs)));
        api_logger_1.ApiLogger.log(`Checkout requeued purchaseId=${payload.purchaseId} retry=${payload.retryCount} correlationId=${payload.correlationId}`, PAYMENT_LOGGER_CONTEXT);
    }
    async getUserPurchases(userId) {
        return this.purchaseRepository.findByUser(userId);
    }
    async getUserMoviesPage(userId, paginationQuery) {
        const paginationParams = this.paginationService.resolve(paginationQuery);
        const { items, total } = await this.purchaseRepository.findByUserPage(userId, paginationParams, purchase_entity_1.PurchaseStatus.COMPLETED);
        const movies = items
            .map((purchase) => purchase.movie)
            .filter((movie) => Boolean(movie));
        return this.paginationService.buildResult(movies, total, paginationParams);
    }
    async handleStripeWebhook(rawBody, signature) {
        const event = this.stripeWebhookService.constructEvent(rawBody, signature);
        if (this.isWebhookEventProcessed(event.id)) {
            api_logger_1.ApiLogger.debug(`Skipping duplicate Stripe event ${event.id}`, PAYMENT_LOGGER_CONTEXT);
            await this.recordWebhookDuplicateAudit(event);
            return;
        }
        await this.processStripeEvent(event);
        this.processedWebhookEvents.add(event.id);
    }
    async processStripeEvent(event) {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await this.handlePaymentIntentSucceeded(event);
                return;
            case 'payment_intent.payment_failed':
                await this.handlePaymentIntentFailed(event);
                return;
            default:
                api_logger_1.ApiLogger.debug(`Ignoring unsupported Stripe event ${event.type}`, PAYMENT_LOGGER_CONTEXT);
        }
    }
    async handlePaymentIntentSucceeded(event) {
        const metadata = this.extractPaymentIntentMetadata(event);
        const purchase = metadata.purchaseId
            ? await this.purchaseRepository.findById(metadata.purchaseId)
            : metadata.correlationId
                ? await this.purchaseRepository.findByCorrelationId(metadata.correlationId)
                : null;
        if (!purchase) {
            api_logger_1.ApiLogger.warn(`Stripe success webhook without matching purchase. event=${event.id}`, PAYMENT_LOGGER_CONTEXT);
            return;
        }
        if (purchase.status === purchase_entity_1.PurchaseStatus.COMPLETED) {
            return;
        }
        await this.updatePurchaseStatusWithAudit(purchase.id, purchase_entity_1.PurchaseStatus.COMPLETED, payment_audit_entity_1.PaymentAuditSource.WEBHOOK, `Stripe event ${event.id} approved payment intent`);
    }
    async handlePaymentIntentFailed(event) {
        const metadata = this.extractPaymentIntentMetadata(event);
        const purchase = metadata.purchaseId
            ? await this.purchaseRepository.findById(metadata.purchaseId)
            : metadata.correlationId
                ? await this.purchaseRepository.findByCorrelationId(metadata.correlationId)
                : null;
        if (!purchase) {
            api_logger_1.ApiLogger.warn(`Stripe failed webhook without matching purchase. event=${event.id}`, PAYMENT_LOGGER_CONTEXT);
            return;
        }
        if (purchase.status === purchase_entity_1.PurchaseStatus.COMPLETED) {
            api_logger_1.ApiLogger.warn(`Ignoring failed webhook for already completed purchase=${purchase.id}`, PAYMENT_LOGGER_CONTEXT);
            return;
        }
        await this.updatePurchaseStatusWithAudit(purchase.id, purchase_entity_1.PurchaseStatus.FAILED, payment_audit_entity_1.PaymentAuditSource.WEBHOOK, `Stripe event ${event.id} reported payment failure`);
    }
    extractPaymentIntentMetadata(event) {
        const intent = event.data.object;
        return {
            purchaseId: intent.metadata?.purchaseId,
            correlationId: intent.metadata?.correlationId,
        };
    }
    isWebhookEventProcessed(eventId) {
        return this.processedWebhookEvents.has(eventId);
    }
    async updatePurchaseStatusWithAudit(purchaseId, status, source, message) {
        const currentPurchase = await this.purchaseRepository.findById(purchaseId);
        if (!currentPurchase) {
            return null;
        }
        const purchase = currentPurchase.status === status
            ? currentPurchase
            : await this.purchaseRepository.updateStatus(purchaseId, status);
        await this.paymentAuditService.captureFromPurchase(purchase, payment_audit_entity_1.PaymentAuditEventType.STATUS_UPDATED, source, message);
        return purchase;
    }
    async recordRetryScheduledAudit(purchaseId, retryCount) {
        await this.recordAuditByPurchaseId(purchaseId, payment_audit_entity_1.PaymentAuditEventType.RETRY_SCHEDULED, payment_audit_entity_1.PaymentAuditSource.WORKER, `Pagamento reagendado para tentativa ${retryCount}`);
    }
    async recordDlqMovedAudit(purchaseId, reason) {
        await this.recordAuditByPurchaseId(purchaseId, payment_audit_entity_1.PaymentAuditEventType.DLQ_MOVED, payment_audit_entity_1.PaymentAuditSource.WORKER, `Pagamento movido para DLQ: ${reason}`);
    }
    async sendToDeadLetterQueue(payload, reason) {
        const publishTimeoutMs = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'RABBITMQ_PUBLISH_TIMEOUT_MS', DEFAULT_PUBLISH_TIMEOUT_MS);
        const deadLetterPayload = {
            ...payload,
            reason,
            failedAt: new Date().toISOString(),
        };
        await (0, rxjs_1.firstValueFrom)(this.deadLetterClient
            .emit(exports.CHECKOUT_FAILED_EVENT, deadLetterPayload)
            .pipe((0, rxjs_1.timeout)(publishTimeoutMs)));
        api_logger_1.ApiLogger.warn(`Checkout moved to DLQ purchaseId=${payload.purchaseId} reason=${reason} correlationId=${payload.correlationId}`, PAYMENT_LOGGER_CONTEXT);
    }
    async recordWebhookDuplicateAudit(event) {
        const metadata = this.extractPaymentIntentMetadata(event);
        const purchase = metadata.purchaseId
            ? await this.purchaseRepository.findById(metadata.purchaseId)
            : metadata.correlationId
                ? await this.purchaseRepository.findByCorrelationId(metadata.correlationId)
                : null;
        if (!purchase) {
            return;
        }
        await this.paymentAuditService.captureFromPurchase(purchase, payment_audit_entity_1.PaymentAuditEventType.WEBHOOK_DUPLICATE_IGNORED, payment_audit_entity_1.PaymentAuditSource.WEBHOOK, `Evento duplicado ignorado: ${event.id}`);
    }
    async recordAuditByPurchaseId(purchaseId, eventType, source, message) {
        const purchase = await this.purchaseRepository.findById(purchaseId);
        if (!purchase) {
            return;
        }
        await this.paymentAuditService.captureFromPurchase(purchase, eventType, source, message);
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(purchase_repository_1.PURCHASE_REPOSITORY)),
    __param(1, (0, common_1.Inject)(rabbitmq_module_1.PAYMENT_QUEUE_CLIENT)),
    __param(2, (0, common_1.Inject)(rabbitmq_module_1.PAYMENT_DLQ_CLIENT)),
    __metadata("design:paramtypes", [Object, microservices_1.ClientProxy,
        microservices_1.ClientProxy,
        movie_service_1.MovieService,
        config_1.ConfigService,
        pagination_service_1.PaginationService,
        stripe_webhook_service_1.StripeWebhookService,
        payment_audit_service_1.PaymentAuditService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map