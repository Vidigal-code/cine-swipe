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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeWebhookService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const stripe_1 = __importDefault(require("stripe"));
let StripeWebhookService = class StripeWebhookService {
    configService;
    stripeClient = null;
    constructor(configService) {
        this.configService = configService;
    }
    constructEvent(rawBody, signature) {
        if (!signature) {
            throw new common_1.UnauthorizedException('Missing Stripe signature');
        }
        const webhookSecret = this.configService.get('STRIPE_WEBHOOK_SECRET');
        if (!webhookSecret) {
            throw new common_1.BadRequestException('STRIPE_WEBHOOK_SECRET is not configured');
        }
        return this.getStripeClient().webhooks.constructEvent(rawBody, signature, webhookSecret);
    }
    getStripeClient() {
        if (this.stripeClient) {
            return this.stripeClient;
        }
        const apiKey = this.configService.get('STRIPE_SECRET_KEY');
        if (!apiKey) {
            throw new common_1.BadRequestException('STRIPE_SECRET_KEY is not configured');
        }
        this.stripeClient = new stripe_1.default(apiKey);
        return this.stripeClient;
    }
};
exports.StripeWebhookService = StripeWebhookService;
exports.StripeWebhookService = StripeWebhookService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], StripeWebhookService);
//# sourceMappingURL=stripe-webhook.service.js.map