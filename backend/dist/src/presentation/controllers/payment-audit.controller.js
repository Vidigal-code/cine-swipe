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
exports.PaymentAuditController = void 0;
const common_1 = require("@nestjs/common");
const jwt_guard_1 = require("../../infrastructure/auth/guards/jwt.guard");
const roles_decorator_1 = require("../../infrastructure/auth/roles.decorator");
const user_entity_1 = require("../../domain/user/entities/user.entity");
const payment_audit_service_1 = require("../../application/payment/payment-audit.service");
const pagination_query_dto_1 = require("../../shared/pagination/pagination-query.dto");
const response_factory_1 = require("../../shared/http-response/response.factory");
let PaymentAuditController = class PaymentAuditController {
    paymentAuditService;
    responseFactory;
    constructor(paymentAuditService, responseFactory) {
        this.paymentAuditService = paymentAuditService;
        this.responseFactory = responseFactory;
    }
    async listAudits(query) {
        const paginatedAudits = await this.paymentAuditService.getAuditPage(query);
        return this.responseFactory.paginated(paginatedAudits);
    }
};
exports.PaymentAuditController = PaymentAuditController;
__decorate([
    (0, common_1.Get)('audits'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], PaymentAuditController.prototype, "listAudits", null);
exports.PaymentAuditController = PaymentAuditController = __decorate([
    (0, common_1.Controller)('payments/admin'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [payment_audit_service_1.PaymentAuditService,
        response_factory_1.ResponseFactory])
], PaymentAuditController);
//# sourceMappingURL=payment-audit.controller.js.map