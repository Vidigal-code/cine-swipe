"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const payment_controller_1 = require("../presentation/controllers/payment.controller");
const payment_audit_controller_1 = require("../presentation/controllers/payment-audit.controller");
const stripe_webhook_controller_1 = require("../presentation/controllers/stripe-webhook.controller");
const payment_worker_1 = require("../presentation/workers/payment.worker");
const payment_service_1 = require("../application/payment/payment.service");
const purchase_repository_1 = require("../infrastructure/database/repositories/purchase.repository");
const purchase_repository_2 = require("../domain/payment/interfaces/purchase.repository");
const payment_audit_service_1 = require("../application/payment/payment-audit.service");
const payment_audit_repository_1 = require("../infrastructure/database/repositories/payment-audit.repository");
const payment_audit_repository_2 = require("../domain/payment/interfaces/payment-audit.repository");
const rabbitmq_module_1 = require("../infrastructure/messaging/rabbitmq.module");
const movie_module_1 = require("./movie.module");
const database_module_1 = require("../infrastructure/database/database.module");
const stripe_gateway_1 = require("../infrastructure/payment/stripe.gateway");
const payment_gateway_factory_1 = require("../infrastructure/payment/payment-gateway.factory");
const mock_payment_gateway_1 = require("../infrastructure/payment/mock-payment.gateway");
const stripe_webhook_service_1 = require("../infrastructure/payment/stripe-webhook.service");
const jwt_guard_1 = require("../infrastructure/auth/guards/jwt.guard");
const shared_module_1 = require("../shared/shared.module");
const payment_outbox_dispatcher_1 = require("../presentation/workers/payment-outbox.dispatcher");
const response_module_1 = require("../shared/http-response/response.module");
let PaymentModule = class PaymentModule {
};
exports.PaymentModule = PaymentModule;
exports.PaymentModule = PaymentModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            rabbitmq_module_1.RabbitMQModule,
            movie_module_1.MovieModule,
            shared_module_1.SharedModule,
            response_module_1.ResponseModule,
            jwt_1.JwtModule,
        ],
        controllers: [
            payment_controller_1.PaymentController,
            payment_audit_controller_1.PaymentAuditController,
            stripe_webhook_controller_1.StripeWebhookController,
            payment_worker_1.PaymentWorker,
        ],
        providers: [
            payment_service_1.PaymentService,
            payment_audit_service_1.PaymentAuditService,
            payment_outbox_dispatcher_1.PaymentOutboxDispatcher,
            jwt_guard_1.JwtAuthGuard,
            stripe_gateway_1.StripeGateway,
            stripe_webhook_service_1.StripeWebhookService,
            mock_payment_gateway_1.MockPaymentGateway,
            payment_gateway_factory_1.PaymentGatewayFactory,
            {
                provide: purchase_repository_2.PURCHASE_REPOSITORY,
                useClass: purchase_repository_1.PrismaPurchaseRepository,
            },
            {
                provide: payment_audit_repository_2.PAYMENT_AUDIT_REPOSITORY,
                useClass: payment_audit_repository_1.PrismaPaymentAuditRepository,
            },
        ],
    })
], PaymentModule);
//# sourceMappingURL=payment.module.js.map