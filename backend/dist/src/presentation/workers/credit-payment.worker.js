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
exports.CreditPaymentWorker = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const rxjs_1 = require("rxjs");
const payment_gateway_factory_1 = require("../../infrastructure/payment/payment-gateway.factory");
const env_number_util_1 = require("../../shared/config/env-number.util");
const api_logger_1 = require("../../shared/logger/api-logger");
const credit_service_1 = require("../../application/credit/credit.service");
const credit_purchase_entity_1 = require("../../domain/credit/entities/credit-purchase.entity");
const rabbitmq_module_1 = require("../../infrastructure/messaging/rabbitmq.module");
const microservices_2 = require("@nestjs/microservices");
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_CURRENCY = 'brl';
const DEFAULT_PUBLISH_TIMEOUT_MS = 5000;
const WORKER_LOGGER_CONTEXT = 'CreditPaymentWorker';
let CreditPaymentWorker = class CreditPaymentWorker {
    creditService;
    paymentGatewayFactory;
    configService;
    rabbitClient;
    deadLetterClient;
    constructor(creditService, paymentGatewayFactory, configService, rabbitClient, deadLetterClient) {
        this.creditService = creditService;
        this.paymentGatewayFactory = paymentGatewayFactory;
        this.configService = configService;
        this.rabbitClient = rabbitClient;
        this.deadLetterClient = deadLetterClient;
    }
    async handleProcessCreditPayment(event, context) {
        const channel = context.getChannelRef();
        const message = context.getMessage();
        const maxRetries = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'CREDIT_PAYMENT_MAX_RETRIES', DEFAULT_MAX_RETRIES);
        try {
            const purchase = await this.creditService.markCheckoutLookup(event.creditPurchaseId);
            if (!purchase) {
                api_logger_1.ApiLogger.warn(`Credit purchase nao encontrada id=${event.creditPurchaseId}`, WORKER_LOGGER_CONTEXT);
                channel.ack(message);
                return;
            }
            if (purchase.status !== credit_purchase_entity_1.CreditPurchaseStatus.PENDING) {
                channel.ack(message);
                return;
            }
            const gateway = this.paymentGatewayFactory.resolveGateway(event.provider);
            const result = await gateway.processPayment({
                purchaseId: event.creditPurchaseId,
                amount: event.amountBrl,
                correlationId: event.correlationId,
                currency: this.configService.get('STRIPE_CURRENCY', DEFAULT_CURRENCY),
            });
            if (result.approved) {
                await this.creditService.markCheckoutCompleted(event.creditPurchaseId, result.externalReference);
                channel.ack(message);
                return;
            }
            if (this.shouldRetry(event.retryCount, maxRetries)) {
                await this.requeue(event);
            }
            else {
                await this.creditService.markCheckoutFailed(event.creditPurchaseId, result.failureReason ?? 'gateway_declined_after_max_retries', result.externalReference);
                await this.sendToDlq(event, 'gateway_declined_after_max_retries');
            }
            channel.ack(message);
        }
        catch (error) {
            api_logger_1.ApiLogger.error(`Falha no processamento de creditPurchase=${event.creditPurchaseId}: ${error instanceof Error ? error.message : 'unknown'}`, WORKER_LOGGER_CONTEXT);
            if (this.shouldRetry(event.retryCount, maxRetries)) {
                await this.requeue(event);
            }
            else {
                await this.creditService.markCheckoutFailed(event.creditPurchaseId, 'gateway_exception_after_max_retries');
                await this.sendToDlq(event, 'gateway_exception_after_max_retries');
            }
            channel.ack(message);
        }
    }
    shouldRetry(retryCount, maxRetries) {
        return retryCount < maxRetries;
    }
    async requeue(event) {
        const publishTimeoutMs = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'RABBITMQ_PUBLISH_TIMEOUT_MS', DEFAULT_PUBLISH_TIMEOUT_MS);
        await (0, rxjs_1.firstValueFrom)(this.rabbitClient
            .emit(credit_service_1.CREDIT_CHECKOUT_REQUESTED_EVENT, {
            ...event,
            retryCount: event.retryCount + 1,
        })
            .pipe((0, rxjs_1.timeout)(publishTimeoutMs)));
    }
    async sendToDlq(event, reason) {
        const publishTimeoutMs = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'RABBITMQ_PUBLISH_TIMEOUT_MS', DEFAULT_PUBLISH_TIMEOUT_MS);
        await (0, rxjs_1.firstValueFrom)(this.deadLetterClient
            .emit(credit_service_1.CREDIT_CHECKOUT_FAILED_EVENT, {
            ...event,
            reason,
            failedAt: new Date().toISOString(),
        })
            .pipe((0, rxjs_1.timeout)(publishTimeoutMs)));
    }
};
exports.CreditPaymentWorker = CreditPaymentWorker;
__decorate([
    (0, microservices_1.EventPattern)(credit_service_1.CREDIT_CHECKOUT_REQUESTED_EVENT),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], CreditPaymentWorker.prototype, "handleProcessCreditPayment", null);
exports.CreditPaymentWorker = CreditPaymentWorker = __decorate([
    (0, common_1.Controller)(),
    __param(3, (0, common_1.Inject)(rabbitmq_module_1.PAYMENT_QUEUE_CLIENT)),
    __param(4, (0, common_1.Inject)(rabbitmq_module_1.PAYMENT_DLQ_CLIENT)),
    __metadata("design:paramtypes", [credit_service_1.CreditService,
        payment_gateway_factory_1.PaymentGatewayFactory,
        config_1.ConfigService,
        microservices_2.ClientProxy,
        microservices_2.ClientProxy])
], CreditPaymentWorker);
//# sourceMappingURL=credit-payment.worker.js.map