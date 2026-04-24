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
exports.PaymentWorker = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const purchase_repository_1 = require("../../domain/payment/interfaces/purchase.repository");
const purchase_entity_1 = require("../../domain/payment/entities/purchase.entity");
const payment_gateway_factory_1 = require("../../infrastructure/payment/payment-gateway.factory");
const payment_service_1 = require("../../application/payment/payment.service");
const config_1 = require("@nestjs/config");
const api_logger_1 = require("../../shared/logger/api-logger");
const env_number_util_1 = require("../../shared/config/env-number.util");
const payment_audit_entity_1 = require("../../domain/payment/entities/payment-audit.entity");
const DEFAULT_MAX_RETRIES = 3;
const DEFAULT_CURRENCY = 'brl';
const LOGGER_CONTEXT = 'PaymentWorker';
let PaymentWorker = class PaymentWorker {
    purchaseRepository;
    paymentGatewayFactory;
    paymentService;
    configService;
    constructor(purchaseRepository, paymentGatewayFactory, paymentService, configService) {
        this.purchaseRepository = purchaseRepository;
        this.paymentGatewayFactory = paymentGatewayFactory;
        this.paymentService = paymentService;
        this.configService = configService;
    }
    async handleProcessPayment(event, context) {
        const channel = context.getChannelRef();
        const message = context.getMessage();
        const maxRetries = (0, env_number_util_1.readPositiveIntConfig)(this.configService, 'PAYMENT_MAX_RETRIES', DEFAULT_MAX_RETRIES);
        try {
            const purchase = await this.purchaseRepository.findById(event.purchaseId);
            if (!purchase) {
                api_logger_1.ApiLogger.warn(`Purchase not found: ${event.purchaseId}`, LOGGER_CONTEXT);
                channel.ack(message);
                return;
            }
            if (purchase.status !== purchase_entity_1.PurchaseStatus.PENDING) {
                api_logger_1.ApiLogger.log(`Skipping already processed purchase: ${event.purchaseId} (${purchase.status})`, LOGGER_CONTEXT);
                channel.ack(message);
                return;
            }
            const gateway = this.paymentGatewayFactory.resolveGateway(event.provider);
            const result = await gateway.processPayment({
                purchaseId: event.purchaseId,
                amount: event.amount,
                correlationId: event.correlationId,
                currency: this.configService.get('STRIPE_CURRENCY', DEFAULT_CURRENCY),
            });
            if (result.approved) {
                await this.paymentService.updatePurchaseStatusWithAudit(event.purchaseId, purchase_entity_1.PurchaseStatus.COMPLETED, payment_audit_entity_1.PaymentAuditSource.WORKER, 'Pagamento aprovado no worker assíncrono');
                api_logger_1.ApiLogger.log(`Payment approved purchaseId=${event.purchaseId} correlationId=${event.correlationId}`, LOGGER_CONTEXT);
                channel.ack(message);
                return;
            }
            if (this.shouldRetry(event.retryCount, maxRetries)) {
                await this.requeueWithNextRetry(event);
                channel.ack(message);
                return;
            }
            await this.paymentService.updatePurchaseStatusWithAudit(event.purchaseId, purchase_entity_1.PurchaseStatus.FAILED, payment_audit_entity_1.PaymentAuditSource.WORKER, 'Pagamento recusado após tentativas máximas');
            await this.moveToDlqSafely(event, 'gateway_declined_after_max_retries');
            channel.ack(message);
        }
        catch (error) {
            api_logger_1.ApiLogger.error(`Payment processing failed for ${event.purchaseId}: ${error instanceof Error ? error.message : 'unknown'}`, LOGGER_CONTEXT);
            if (this.shouldRetry(event.retryCount, maxRetries)) {
                await this.requeueWithNextRetry(event);
            }
            else {
                await this.paymentService.updatePurchaseStatusWithAudit(event.purchaseId, purchase_entity_1.PurchaseStatus.FAILED, payment_audit_entity_1.PaymentAuditSource.WORKER, 'Pagamento falhou por exceção após tentativas máximas');
                await this.moveToDlqSafely(event, 'gateway_exception_after_max_retries');
            }
            channel.ack(message);
        }
    }
    shouldRetry(retryCount, maxRetries) {
        return retryCount < maxRetries;
    }
    async requeueWithNextRetry(event) {
        const nextRetry = event.retryCount + 1;
        await this.paymentService.requeueCheckout({
            ...event,
            retryCount: nextRetry,
        });
        await this.paymentService.recordRetryScheduledAudit(event.purchaseId, nextRetry);
    }
    async moveToDlqSafely(event, reason) {
        try {
            await this.paymentService.sendToDeadLetterQueue(event, reason);
            await this.paymentService.recordDlqMovedAudit(event.purchaseId, reason);
        }
        catch (error) {
            api_logger_1.ApiLogger.error(`Failed to move message to DLQ purchaseId=${event.purchaseId} reason=${reason} error=${error instanceof Error ? error.message : 'unknown'}`, LOGGER_CONTEXT);
        }
    }
};
exports.PaymentWorker = PaymentWorker;
__decorate([
    (0, microservices_1.EventPattern)(payment_service_1.CHECKOUT_REQUESTED_EVENT),
    __param(0, (0, microservices_1.Payload)()),
    __param(1, (0, microservices_1.Ctx)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, microservices_1.RmqContext]),
    __metadata("design:returntype", Promise)
], PaymentWorker.prototype, "handleProcessPayment", null);
exports.PaymentWorker = PaymentWorker = __decorate([
    (0, common_1.Controller)(),
    __param(0, (0, common_1.Inject)(purchase_repository_1.PURCHASE_REPOSITORY)),
    __metadata("design:paramtypes", [Object, payment_gateway_factory_1.PaymentGatewayFactory,
        payment_service_1.PaymentService,
        config_1.ConfigService])
], PaymentWorker);
//# sourceMappingURL=payment.worker.js.map