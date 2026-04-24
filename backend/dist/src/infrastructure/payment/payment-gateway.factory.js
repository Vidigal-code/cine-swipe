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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentGatewayFactory = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const mock_payment_gateway_1 = require("./mock-payment.gateway");
const stripe_gateway_1 = require("./stripe.gateway");
let PaymentGatewayFactory = class PaymentGatewayFactory {
    configService;
    mockPaymentGateway;
    stripeGateway;
    constructor(configService, mockPaymentGateway, stripeGateway) {
        this.configService = configService;
        this.mockPaymentGateway = mockPaymentGateway;
        this.stripeGateway = stripeGateway;
    }
    resolveGateway(provider) {
        if (provider === 'stripe') {
            return this.stripeGateway;
        }
        return this.mockPaymentGateway;
    }
    resolveDefaultProvider() {
        return this.configService.get('PAYMENT_PROVIDER', 'mock');
    }
};
exports.PaymentGatewayFactory = PaymentGatewayFactory;
exports.PaymentGatewayFactory = PaymentGatewayFactory = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        mock_payment_gateway_1.MockPaymentGateway,
        stripe_gateway_1.StripeGateway])
], PaymentGatewayFactory);
//# sourceMappingURL=payment-gateway.factory.js.map