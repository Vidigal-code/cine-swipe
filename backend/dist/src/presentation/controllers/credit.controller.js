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
exports.CreditController = void 0;
const common_1 = require("@nestjs/common");
const credit_service_1 = require("../../application/credit/credit.service");
const jwt_guard_1 = require("../../infrastructure/auth/guards/jwt.guard");
const roles_decorator_1 = require("../../infrastructure/auth/roles.decorator");
const user_entity_1 = require("../../domain/user/entities/user.entity");
const response_factory_1 = require("../../shared/http-response/response.factory");
const pagination_query_dto_1 = require("../../shared/pagination/pagination-query.dto");
const create_credit_checkout_dto_1 = require("./dto/credit/create-credit-checkout.dto");
const consume_credits_dto_1 = require("./dto/credit/consume-credits.dto");
let CreditController = class CreditController {
    creditService;
    responseFactory;
    constructor(creditService, responseFactory) {
        this.creditService = creditService;
        this.responseFactory = responseFactory;
    }
    async getBalance(req) {
        const balance = await this.creditService.getUserBalance(req.user.sub);
        return this.responseFactory.resource({ balance });
    }
    async getPlans(query) {
        const plans = await this.creditService.getActivePlansPage(query);
        return this.responseFactory.paginated(plans);
    }
    async getHistory(req, query) {
        const result = await this.creditService.getUserTransactionsPage(req.user.sub, query);
        return this.responseFactory.paginated(result);
    }
    async getPurchases(req, query) {
        const result = await this.creditService.getUserCreditPurchasesPage(req.user.sub, query);
        return this.responseFactory.paginated(result);
    }
    async checkout(req, body) {
        const purchase = await this.creditService.createCheckout(req.user.sub, body.creditPlanId);
        return this.responseFactory.resource(purchase);
    }
    async consume(req, body) {
        await this.creditService.consumeCredits(req.user.sub, body.amount, body.description, body.correlationId);
        return this.responseFactory.success(true);
    }
};
exports.CreditController = CreditController;
__decorate([
    (0, common_1.Get)('balance'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], CreditController.prototype, "getBalance", null);
__decorate([
    (0, common_1.Get)('plans'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], CreditController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Get)('history'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], CreditController.prototype, "getHistory", null);
__decorate([
    (0, common_1.Get)('purchases'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], CreditController.prototype, "getPurchases", null);
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_credit_checkout_dto_1.CreateCreditCheckoutDto]),
    __metadata("design:returntype", Promise)
], CreditController.prototype, "checkout", null);
__decorate([
    (0, common_1.Post)('consume'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, consume_credits_dto_1.ConsumeCreditsDto]),
    __metadata("design:returntype", Promise)
], CreditController.prototype, "consume", null);
exports.CreditController = CreditController = __decorate([
    (0, common_1.Controller)('credits'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.USER, user_entity_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [credit_service_1.CreditService,
        response_factory_1.ResponseFactory])
], CreditController);
//# sourceMappingURL=credit.controller.js.map