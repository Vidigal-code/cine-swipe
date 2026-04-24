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
exports.CreditOutboxDispatcher = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
const credit_repository_1 = require("../../domain/credit/interfaces/credit.repository");
const credit_purchase_outbox_entity_1 = require("../../domain/credit/entities/credit-purchase-outbox.entity");
const rabbitmq_module_1 = require("../../infrastructure/messaging/rabbitmq.module");
const env_number_util_1 = require("../../shared/config/env-number.util");
const api_logger_1 = require("../../shared/logger/api-logger");
const credit_service_1 = require("../../application/credit/credit.service");
const DEFAULT_DISPATCH_BATCH_SIZE = 25;
const DEFAULT_OUTBOX_MAX_ATTEMPTS = 5;
const DEFAULT_OUTBOX_RETRY_DELAY_MS = 2000;
const DEFAULT_PUBLISH_TIMEOUT_MS = 5000;
const DISPATCHER_LOGGER_CONTEXT = 'CreditOutboxDispatcher';
let CreditOutboxDispatcher = class CreditOutboxDispatcher {
    creditRepository;
    rabbitClient;
    deadLetterClient;
    configService;
    dispatcherTimer = null;
    isDispatching = false;
    constructor(creditRepository, rabbitClient, deadLetterClient, configService) {
        this.creditRepository = creditRepository;
        this.rabbitClient = rabbitClient;
        this.deadLetterClient = deadLetterClient;
        this.configService = configService;
    }
    onModuleInit() {
        const intervalMs = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'CREDIT_OUTBOX_DISPATCH_INTERVAL_MS', 3000);
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
            const batchSize = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'CREDIT_OUTBOX_BATCH_SIZE', DEFAULT_DISPATCH_BATCH_SIZE);
            const events = await this.creditRepository.findOutboxEventsReadyToDispatch(batchSize, new Date());
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
            const payload = {
                creditPurchaseId: event.creditPurchaseId,
                ...event.payload,
            };
            await this.publishEvent(event.eventType, payload);
            await this.creditRepository.markOutboxEventAsSent(event.id);
        }
        catch (error) {
            await this.handleDispatchFailure(event, error);
        }
    }
    async publishEvent(eventType, payload) {
        const publishTimeoutMs = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'RABBITMQ_PUBLISH_TIMEOUT_MS', DEFAULT_PUBLISH_TIMEOUT_MS);
        await (0, rxjs_1.firstValueFrom)(this.rabbitClient
            .emit(eventType, payload)
            .pipe((0, rxjs_1.timeout)(publishTimeoutMs)));
    }
    async handleDispatchFailure(event, error) {
        const nextAttempts = event.attempts + 1;
        const maxAttempts = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'CREDIT_OUTBOX_MAX_ATTEMPTS', DEFAULT_OUTBOX_MAX_ATTEMPTS);
        const shouldRetry = nextAttempts < maxAttempts;
        const retryDelayMs = this.getRetryDelayMs(nextAttempts);
        const nextAttemptAt = shouldRetry
            ? new Date(Date.now() + retryDelayMs)
            : null;
        const errorMessage = error instanceof Error ? error.message : 'credit outbox dispatch error';
        await this.creditRepository.markOutboxEventForRetry(event.id, credit_purchase_outbox_entity_1.CreditPurchaseOutboxStatus.FAILED, nextAttempts, nextAttemptAt, errorMessage);
        if (!shouldRetry) {
            await this.publishOutboxFailureToDlq(event, errorMessage, nextAttempts);
        }
        api_logger_1.ApiLogger.warn(`Credit outbox dispatch falhou eventId=${event.id} purchaseId=${event.creditPurchaseId} attempts=${nextAttempts} retry=${shouldRetry}`, DISPATCHER_LOGGER_CONTEXT);
    }
    getRetryDelayMs(attempts) {
        const baseDelayMs = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'CREDIT_OUTBOX_RETRY_DELAY_MS', DEFAULT_OUTBOX_RETRY_DELAY_MS);
        return baseDelayMs * attempts;
    }
    async publishOutboxFailureToDlq(event, errorMessage, attempts) {
        const publishTimeoutMs = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'RABBITMQ_PUBLISH_TIMEOUT_MS', DEFAULT_PUBLISH_TIMEOUT_MS);
        await (0, rxjs_1.firstValueFrom)(this.deadLetterClient
            .emit(credit_service_1.CREDIT_CHECKOUT_FAILED_EVENT, {
            creditPurchaseId: event.creditPurchaseId,
            outboxEventId: event.id,
            reason: 'credit_outbox_max_attempts_exhausted',
            attempts,
            errorMessage,
            eventType: event.eventType,
            payload: event.payload,
        })
            .pipe((0, rxjs_1.timeout)(publishTimeoutMs)));
    }
};
exports.CreditOutboxDispatcher = CreditOutboxDispatcher;
exports.CreditOutboxDispatcher = CreditOutboxDispatcher = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(credit_repository_1.CREDIT_REPOSITORY)),
    __param(1, (0, common_1.Inject)(rabbitmq_module_1.PAYMENT_QUEUE_CLIENT)),
    __param(2, (0, common_1.Inject)(rabbitmq_module_1.PAYMENT_DLQ_CLIENT)),
    __metadata("design:paramtypes", [Object, microservices_1.ClientProxy,
        microservices_1.ClientProxy,
        config_1.ConfigService])
], CreditOutboxDispatcher);
//# sourceMappingURL=credit-outbox.dispatcher.js.map