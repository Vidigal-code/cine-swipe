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
exports.PrismaPurchaseRepository = void 0;
const common_1 = require("@nestjs/common");
const purchase_entity_1 = require("../../../domain/payment/entities/purchase.entity");
const prisma_service_1 = require("../prisma.service");
const payment_outbox_entity_1 = require("../../../domain/payment/entities/payment-outbox.entity");
const PURCHASE_INCLUDE_RELATIONS = { movie: true, user: true };
const ORDER_BY_CREATED_DESC = { createdAt: 'desc' };
const DEFAULT_PURCHASE_VALUES = {
    userId: '',
    movieId: '',
    amount: 0,
    provider: 'mock',
    correlationId: '',
    status: purchase_entity_1.PurchaseStatus.PENDING,
};
let PrismaPurchaseRepository = class PrismaPurchaseRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(purchaseData) {
        const purchase = await this.prisma.purchase.create({
            data: this.toCreatePurchaseInput(purchaseData),
            include: PURCHASE_INCLUDE_RELATIONS,
        });
        return this.toDomain(purchase);
    }
    async createWithOutbox(purchaseData, outbox) {
        const purchase = await this.prisma.$transaction(async (transactionClient) => {
            const createdPurchase = await this.createPurchaseRecord(transactionClient, purchaseData);
            await this.createOutboxRecord(transactionClient, createdPurchase.id, outbox);
            return createdPurchase;
        });
        return this.toDomain(purchase);
    }
    async findById(id) {
        const purchase = await this.findUniquePurchase({ id });
        return purchase ? this.toDomain(purchase) : null;
    }
    async updateStatus(id, status) {
        const purchase = await this.prisma.purchase.update({
            where: { id },
            data: { status },
            include: PURCHASE_INCLUDE_RELATIONS,
        });
        return this.toDomain(purchase);
    }
    async findByUser(userId) {
        const purchases = await this.prisma.purchase.findMany({
            where: { userId },
            include: PURCHASE_INCLUDE_RELATIONS,
            orderBy: ORDER_BY_CREATED_DESC,
        });
        return this.toDomainList(purchases);
    }
    async findByUserPage(userId, params, status) {
        const whereClause = this.buildUserFilter(userId, status);
        const [purchases, total] = await this.prisma.$transaction([
            this.prisma.purchase.findMany({
                where: whereClause,
                include: PURCHASE_INCLUDE_RELATIONS,
                orderBy: ORDER_BY_CREATED_DESC,
                skip: params.skip,
                take: params.limit,
            }),
            this.prisma.purchase.count({
                where: whereClause,
            }),
        ]);
        return {
            items: this.toDomainList(purchases),
            total,
        };
    }
    async findByCorrelationId(correlationId) {
        const purchase = await this.findUniquePurchase({ correlationId });
        return purchase ? this.toDomain(purchase) : null;
    }
    async findOutboxEventsReadyToDispatch(batchSize, referenceDate) {
        const events = await this.prisma.paymentOutbox.findMany({
            where: {
                OR: [
                    { status: payment_outbox_entity_1.PaymentOutboxStatus.PENDING },
                    {
                        status: payment_outbox_entity_1.PaymentOutboxStatus.FAILED,
                        nextAttemptAt: {
                            lte: referenceDate,
                        },
                    },
                ],
            },
            orderBy: { createdAt: 'asc' },
            take: batchSize,
        });
        return events.map((event) => this.toOutboxDomain(event));
    }
    async markOutboxEventAsSent(eventId) {
        await this.prisma.paymentOutbox.update({
            where: { id: eventId },
            data: {
                status: payment_outbox_entity_1.PaymentOutboxStatus.SENT,
                publishedAt: new Date(),
                lastError: null,
                nextAttemptAt: null,
            },
        });
    }
    async markOutboxEventForRetry(eventId, status, attempts, nextAttemptAt, lastError) {
        await this.prisma.paymentOutbox.update({
            where: { id: eventId },
            data: {
                status,
                attempts,
                nextAttemptAt,
                lastError,
            },
        });
    }
    async createPurchaseRecord(client, purchaseData) {
        return client.purchase.create({
            data: this.toCreatePurchaseInput(purchaseData),
            include: PURCHASE_INCLUDE_RELATIONS,
        });
    }
    async createOutboxRecord(client, purchaseId, outbox) {
        await client.paymentOutbox.create({
            data: {
                purchaseId,
                eventType: outbox.eventType,
                payload: this.toJsonObject(outbox.payload),
                status: payment_outbox_entity_1.PaymentOutboxStatus.PENDING,
            },
        });
    }
    toCreatePurchaseInput(purchaseData) {
        return {
            userId: purchaseData.userId ?? DEFAULT_PURCHASE_VALUES.userId,
            movieId: purchaseData.movieId ?? DEFAULT_PURCHASE_VALUES.movieId,
            amount: purchaseData.amount ?? DEFAULT_PURCHASE_VALUES.amount,
            status: purchaseData.status ?? DEFAULT_PURCHASE_VALUES.status,
            provider: purchaseData.provider ?? DEFAULT_PURCHASE_VALUES.provider,
            correlationId: purchaseData.correlationId ?? DEFAULT_PURCHASE_VALUES.correlationId,
        };
    }
    async findUniquePurchase(where) {
        return this.prisma.purchase.findUnique({
            where,
            include: PURCHASE_INCLUDE_RELATIONS,
        });
    }
    buildUserFilter(userId, status) {
        return status ? { userId, status } : { userId };
    }
    toDomainList(purchases) {
        return purchases.map((purchase) => this.toDomain(purchase));
    }
    toDomain(purchase) {
        return {
            id: purchase.id,
            userId: purchase.userId,
            movieId: purchase.movieId,
            amount: this.toNumber(purchase.amount),
            status: purchase.status,
            provider: purchase.provider,
            correlationId: purchase.correlationId,
            stripePaymentIntentId: purchase.stripePaymentIntentId ?? null,
            failureReason: purchase.failureReason ?? null,
            createdAt: purchase.createdAt,
            updatedAt: purchase.updatedAt,
            movie: purchase.movie
                ? {
                    ...purchase.movie,
                    price: this.toNumber(purchase.movie.price),
                }
                : null,
            user: purchase.user
                ? {
                    ...purchase.user,
                    role: purchase.user.role,
                }
                : null,
        };
    }
    toOutboxDomain(event) {
        return {
            id: event.id,
            purchaseId: event.purchaseId,
            eventType: event.eventType,
            payload: event.payload,
            status: event.status,
            attempts: event.attempts,
            nextAttemptAt: event.nextAttemptAt,
            lastError: event.lastError,
            publishedAt: event.publishedAt,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
        };
    }
    toNumber(value) {
        return typeof value === 'number' ? value : value.toNumber();
    }
    toJsonObject(value) {
        const entries = Object.entries(value).map(([key, entryValue]) => [
            key,
            this.toJsonValue(entryValue),
        ]);
        return Object.fromEntries(entries);
    }
    toJsonValue(value) {
        if (value === null ||
            typeof value === 'string' ||
            typeof value === 'number' ||
            typeof value === 'boolean') {
            return value;
        }
        if (Array.isArray(value)) {
            return value.map((item) => this.toJsonValue(item));
        }
        if (typeof value === 'object') {
            return this.toJsonObject(value);
        }
        return String(value);
    }
};
exports.PrismaPurchaseRepository = PrismaPurchaseRepository;
exports.PrismaPurchaseRepository = PrismaPurchaseRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaPurchaseRepository);
//# sourceMappingURL=purchase.repository.js.map