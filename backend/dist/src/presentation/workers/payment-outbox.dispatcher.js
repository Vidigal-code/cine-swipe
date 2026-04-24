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
exports.PaymentOutboxDispatcher = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const payment_outbox_entity_1 = require("../../domain/payment/entities/payment-outbox.entity");
const purchase_repository_1 = require("../../domain/payment/interfaces/purchase.repository");
const rabbitmq_module_1 = require("../../infrastructure/messaging/rabbitmq.module");
const payment_service_1 = require("../../application/payment/payment.service");
const api_logger_1 = require("../../shared/logger/api-logger");
const env_number_util_1 = require("../../shared/config/env-number.util");
const rxjs_1 = require("rxjs");
const DEFAULT_DISPATCH_BATCH_SIZE = 25;
const DEFAULT_OUTBOX_MAX_ATTEMPTS = 5;
const DEFAULT_OUTBOX_RETRY_DELAY_MS = 2000;
const DEFAULT_OUTBOX_PUBLISH_TIMEOUT_MS = 5000;
const LOGGER_CONTEXT = 'PaymentOutboxDispatcher';
let PaymentOutboxDispatcher = class PaymentOutboxDispatcher {
    purchaseRepository;
    rabbitClient;
    deadLetterClient;
    configService;
    dispatcherTimer = null;
    isDispatching = false;
    constructor(purchaseRepository, rabbitClient, deadLetterClient, configService) {
        this.purchaseRepository = purchaseRepository;
        this.rabbitClient = rabbitClient;
        this.deadLetterClient = deadLetterClient;
        this.configService = configService;
    }
    onModuleInit() {
        const intervalMs = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'PAYMENT_OUTBOX_DISPATCH_INTERVAL_MS', 3000);
        this.dispatcherTimer = setInterval(() => {
            void this.dispatchPendingEvents();
        }, intervalMs);
        void this.dispatchPendingEvents();
    }
    onModuleDestroy() {
        if (this.dispatcherTimer) {
            clearInterval(this.dispatcherTimer);
            this.dispatcherTimer = null;
        }
    }
    async dispatchPendingEvents() {
        if (this.isDispatching) {
            return;
        }
        this.isDispatching = true;
        try {
            const batchSize = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'PAYMENT_OUTBOX_BATCH_SIZE', DEFAULT_DISPATCH_BATCH_SIZE);
            const events = await this.purchaseRepository.findOutboxEventsReadyToDispatch(batchSize, new Date());
            for (const event of events) {
                await this.dispatchEvent(event);
            }
        }
        finally {
            this.isDispatching = false;
        }
    }
    async dispatchEvent(event) {
        try {
            const payload = this.buildPayload(event);
            await this.publishEvent(event.eventType, payload);
            await this.purchaseRepository.markOutboxEventAsSent(event.id);
        }
        catch (error) {
            await this.handleDispatchFailure(event, error);
        }
    }
    buildPayload(event) {
        return {
            purchaseId: event.purchaseId,
            ...event.payload,
        };
    }
    async handleDispatchFailure(event, error) {
        const nextAttempts = event.attempts + 1;
        const maxAttempts = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'PAYMENT_OUTBOX_MAX_ATTEMPTS', DEFAULT_OUTBOX_MAX_ATTEMPTS);
        const shouldRetry = nextAttempts < maxAttempts;
        const retryDelayMs = this.getRetryDelayMs(nextAttempts);
        const nextAttemptAt = shouldRetry
            ? new Date(Date.now() + retryDelayMs)
            : null;
        const errorMessage = error instanceof Error ? error.message : 'outbox dispatch error';
        await this.purchaseRepository.markOutboxEventForRetry(event.id, payment_outbox_entity_1.PaymentOutboxStatus.FAILED, nextAttempts, nextAttemptAt, errorMessage);
        if (!shouldRetry) {
            await this.publishOutboxFailureToDlq(event, errorMessage, nextAttempts);
        }
        api_logger_1.ApiLogger.warn(`Outbox dispatch failed eventId=${event.id} purchaseId=${event.purchaseId} attempts=${nextAttempts} retry=${shouldRetry} correlationId=${this.extractCorrelationId(event)}`, LOGGER_CONTEXT);
    }
    getRetryDelayMs(attempts) {
        const baseDelayMs = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'PAYMENT_OUTBOX_RETRY_DELAY_MS', DEFAULT_OUTBOX_RETRY_DELAY_MS);
        return baseDelayMs * attempts;
    }
    async publishEvent(eventType, payload) {
        const publishTimeoutMs = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'RABBITMQ_PUBLISH_TIMEOUT_MS', DEFAULT_OUTBOX_PUBLISH_TIMEOUT_MS);
        await (0, rxjs_1.firstValueFrom)(this.rabbitClient.emit(eventType, payload).pipe((0, rxjs_1.timeout)(publishTimeoutMs)));
        api_logger_1.ApiLogger.debug(`Outbox event published type=${eventType} purchaseId=${String(payload.purchaseId ?? '')} correlationId=${String(payload.correlationId ?? '')}`, LOGGER_CONTEXT);
    }
    async publishOutboxFailureToDlq(event, errorMessage, attempts) {
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
            const publishTimeoutMs = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'RABBITMQ_PUBLISH_TIMEOUT_MS', DEFAULT_OUTBOX_PUBLISH_TIMEOUT_MS);
            await (0, rxjs_1.firstValueFrom)(this.deadLetterClient
                .emit(payment_service_1.CHECKOUT_FAILED_EVENT, payload)
                .pipe((0, rxjs_1.timeout)(publishTimeoutMs)));
            api_logger_1.ApiLogger.warn(`Outbox event moved to DLQ eventId=${event.id} correlationId=${payload.correlationId}`, LOGGER_CONTEXT);
        }
        catch (error) {
            api_logger_1.ApiLogger.error(`Failed to move outbox event to DLQ eventId=${event.id} correlationId=${payload.correlationId} error=${error instanceof Error ? error.message : 'unknown'}`, LOGGER_CONTEXT);
        }
    }
    extractCorrelationId(event) {
        const maybeCorrelation = event.payload.correlationId;
        return typeof maybeCorrelation === 'string' ? maybeCorrelation : 'unknown';
    }
};
exports.PaymentOutboxDispatcher = PaymentOutboxDispatcher;
exports.PaymentOutboxDispatcher = PaymentOutboxDispatcher = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(purchase_repository_1.PURCHASE_REPOSITORY)),
    __param(1, (0, common_1.Inject)(rabbitmq_module_1.PAYMENT_QUEUE_CLIENT)),
    __param(2, (0, common_1.Inject)(rabbitmq_module_1.PAYMENT_DLQ_CLIENT)),
    __metadata("design:paramtypes", [Object, microservices_1.ClientProxy,
        microservices_1.ClientProxy,
        config_1.ConfigService])
], PaymentOutboxDispatcher);
//# sourceMappingURL=payment-outbox.dispatcher.js.map