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
exports.PrismaPaymentAuditRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
let PrismaPaymentAuditRepository = class PrismaPaymentAuditRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(input) {
        const created = await this.prisma.paymentAudit.create({
            data: {
                purchaseId: input.purchaseId,
                userId: input.userId,
                userName: input.userName,
                userEmail: input.userEmail,
                movieId: input.movieId,
                movieTitle: input.movieTitle,
                amount: input.amount,
                provider: input.provider,
                status: input.status,
                correlationId: input.correlationId,
                stripePaymentIntentId: input.stripePaymentIntentId ?? null,
                eventType: input.eventType,
                source: input.source,
                message: input.message ?? null,
            },
        });
        return this.toDomain(created);
    }
    async findPage(params) {
        const [items, total] = await this.prisma.$transaction([
            this.prisma.paymentAudit.findMany({
                orderBy: { createdAt: 'desc' },
                skip: params.skip,
                take: params.limit,
            }),
            this.prisma.paymentAudit.count(),
        ]);
        return {
            items: items.map((item) => this.toDomain(item)),
            total,
        };
    }
    toDomain(record) {
        return {
            id: record.id,
            purchaseId: record.purchaseId,
            userId: record.userId,
            userName: record.userName,
            userEmail: record.userEmail,
            movieId: record.movieId,
            movieTitle: record.movieTitle,
            amount: this.toNumber(record.amount),
            provider: record.provider,
            status: record.status,
            correlationId: record.correlationId,
            stripePaymentIntentId: record.stripePaymentIntentId,
            eventType: record.eventType,
            source: record.source,
            message: record.message,
            createdAt: record.createdAt,
        };
    }
    toNumber(value) {
        return typeof value === 'number' ? value : value.toNumber();
    }
};
exports.PrismaPaymentAuditRepository = PrismaPaymentAuditRepository;
exports.PrismaPaymentAuditRepository = PrismaPaymentAuditRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaPaymentAuditRepository);
//# sourceMappingURL=payment-audit.repository.js.map