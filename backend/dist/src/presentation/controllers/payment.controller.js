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
exports.PaymentController = void 0;
const common_1 = require("@nestjs/common");
const payment_service_1 = require("../../application/payment/payment.service");
const jwt_guard_1 = require("../../infrastructure/auth/guards/jwt.guard");
const roles_decorator_1 = require("../../infrastructure/auth/roles.decorator");
const user_entity_1 = require("../../domain/user/entities/user.entity");
const pagination_query_dto_1 = require("../../shared/pagination/pagination-query.dto");
const checkout_dto_1 = require("./dto/payment/checkout.dto");
const response_factory_1 = require("../../shared/http-response/response.factory");
let PaymentController = class PaymentController {
    paymentService;
    responseFactory;
    constructor(paymentService, responseFactory) {
        this.paymentService = paymentService;
        this.responseFactory = responseFactory;
    }
    async checkout(req, body) {
        const userId = req.user.sub;
        const purchase = await this.paymentService.checkout(userId, body.movieId);
        return this.responseFactory.resource(purchase);
    }
    async getMyMovies(req, query) {
        const userId = req.user.sub;
        const paginatedMovies = await this.paymentService.getUserMoviesPage(userId, query);
        return this.responseFactory.paginated(paginatedMovies);
    }
};
exports.PaymentController = PaymentController;
__decorate([
    (0, common_1.Post)('checkout'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, checkout_dto_1.CheckoutDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "checkout", null);
__decorate([
    (0, common_1.Get)('my-movies'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], PaymentController.prototype, "getMyMovies", null);
exports.PaymentController = PaymentController = __decorate([
    (0, common_1.Controller)('payments'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.USER, user_entity_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [payment_service_1.PaymentService,
        response_factory_1.ResponseFactory])
], PaymentController);
//# sourceMappingURL=payment.controller.js.map