"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreditModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const database_module_1 = require("../infrastructure/database/database.module");
const rabbitmq_module_1 = require("../infrastructure/messaging/rabbitmq.module");
const shared_module_1 = require("../shared/shared.module");
const response_module_1 = require("../shared/http-response/response.module");
const credit_controller_1 = require("../presentation/controllers/credit.controller");
const admin_credit_controller_1 = require("../presentation/controllers/admin-credit.controller");
const credit_payment_worker_1 = require("../presentation/workers/credit-payment.worker");
const credit_outbox_dispatcher_1 = require("../presentation/workers/credit-outbox.dispatcher");
const credit_service_1 = require("../application/credit/credit.service");
const credit_repository_1 = require("../domain/credit/interfaces/credit.repository");
const credit_repository_2 = require("../infrastructure/database/repositories/credit.repository");
const user_repository_1 = require("../domain/user/interfaces/user.repository");
const user_repository_2 = require("../infrastructure/database/repositories/user.repository");
const jwt_guard_1 = require("../infrastructure/auth/guards/jwt.guard");
const payment_gateway_factory_1 = require("../infrastructure/payment/payment-gateway.factory");
const stripe_gateway_1 = require("../infrastructure/payment/stripe.gateway");
const mock_payment_gateway_1 = require("../infrastructure/payment/mock-payment.gateway");
let CreditModule = class CreditModule {
};
exports.CreditModule = CreditModule;
exports.CreditModule = CreditModule = __decorate([
    (0, common_1.Module)({
        imports: [
            database_module_1.DatabaseModule,
            rabbitmq_module_1.RabbitMQModule,
            shared_module_1.SharedModule,
            response_module_1.ResponseModule,
            jwt_1.JwtModule,
        ],
        controllers: [credit_controller_1.CreditController, admin_credit_controller_1.AdminCreditController, credit_payment_worker_1.CreditPaymentWorker],
        providers: [
            credit_service_1.CreditService,
            credit_outbox_dispatcher_1.CreditOutboxDispatcher,
            jwt_guard_1.JwtAuthGuard,
            payment_gateway_factory_1.PaymentGatewayFactory,
            stripe_gateway_1.StripeGateway,
            mock_payment_gateway_1.MockPaymentGateway,
            {
                provide: credit_repository_1.CREDIT_REPOSITORY,
                useClass: credit_repository_2.PrismaCreditRepository,
            },
            {
                provide: user_repository_1.USER_REPOSITORY,
                useClass: user_repository_2.PrismaUserRepository,
            },
        ],
        exports: [credit_service_1.CreditService, credit_repository_1.CREDIT_REPOSITORY],
    })
], CreditModule);
//# sourceMappingURL=credit.module.js.map