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
exports.StripeWebhookController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("../../application/payment/payment.service");
const response_factory_1 = require("../../shared/http-response/response.factory");
let StripeWebhookController = class StripeWebhookController {
    paymentService;
    responseFactory;
    constructor(paymentService, responseFactory) {
        this.paymentService = paymentService;
        this.responseFactory = responseFactory;
    }
    async handleStripeWebhook(request, signature) {
        const rawBody = request.rawBody;
        if (!rawBody) {
            throw new common_1.BadRequestException('Stripe raw body is required');
        }
        await this.paymentService.handleStripeWebhook(rawBody, signature);
        return this.responseFactory.received();
    }
};
exports.StripeWebhookController = StripeWebhookController;
__decorate([
    (0, common_1.Post)('stripe'),
    (0, common_1.HttpCode)(200),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Headers)('stripe-signature')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], StripeWebhookController.prototype, "handleStripeWebhook", null);
exports.StripeWebhookController = StripeWebhookController = __decorate([
    (0, common_1.Controller)('payments/webhook'),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        response_factory_1.ResponseFactory])
], StripeWebhookController);
//# sourceMappingURL=stripe-webhook.controller.js.map