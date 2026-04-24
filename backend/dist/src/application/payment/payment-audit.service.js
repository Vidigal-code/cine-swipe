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
exports.PaymentAuditService = void 0;
const common_1 = require("@nestjs/common");
const payment_audit_repository_1 = require("../../domain/payment/interfaces/payment-audit.repository");
const pagination_service_1 = require("../../shared/pagination/pagination.service");
const payment_audit_constants_1 = require("../../shared/payment/payment-audit.constants");
let PaymentAuditService = class PaymentAuditService {
    paymentAuditRepository;
    paginationService;
    constructor(paymentAuditRepository, paginationService) {
        this.paymentAuditRepository = paymentAuditRepository;
        this.paginationService = paginationService;
    }
    async captureFromPurchase(purchase, eventType, source, message) {
        await this.paymentAuditRepository.create({
            purchaseId: purchase.id,
            userId: purchase.userId,
            userName: this.resolveUserName(purchase),
            userEmail: this.resolveUserEmail(purchase),
            movieId: purchase.movieId,
            movieTitle: this.resolveMovieTitle(purchase),
            amount: purchase.amount,
            provider: purchase.provider,
            status: purchase.status,
            correlationId: purchase.correlationId,
            eventType,
            source,
            message,
        });
    }
    async getAuditPage(paginationQuery) {
        const pagination = this.paginationService.resolve(paginationQuery);
        const { items, total } = await this.paymentAuditRepository.findPage(pagination);
        return this.paginationService.buildResult(items, total, pagination);
    }
    resolveUserName(purchase) {
        if (purchase.user?.username) {
            return purchase.user.username;
        }
        if (purchase.user?.email) {
            return purchase.user.email.split('@')[0];
        }
        return payment_audit_constants_1.PAYMENT_AUDIT_UNKNOWN_USER_NAME;
    }
    resolveUserEmail(purchase) {
        return purchase.user?.email ?? payment_audit_constants_1.PAYMENT_AUDIT_UNKNOWN_USER_EMAIL;
    }
    resolveMovieTitle(purchase) {
        return purchase.movie?.title ?? payment_audit_constants_1.PAYMENT_AUDIT_UNKNOWN_MOVIE_TITLE;
    }
};
exports.PaymentAuditService = PaymentAuditService;
exports.PaymentAuditService = PaymentAuditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(payment_audit_repository_1.PAYMENT_AUDIT_REPOSITORY)),
    __metadata("design:paramtypes", [Object, pagination_service_1.PaginationService])
], PaymentAuditService);
//# sourceMappingURL=payment-audit.service.js.map