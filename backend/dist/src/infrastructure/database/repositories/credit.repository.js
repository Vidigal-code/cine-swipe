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
exports.CREDIT_REPOSITORY_PROVIDER = exports.PrismaCreditRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const credit_repository_1 = require("../../../domain/credit/interfaces/credit.repository");
const credit_purchase_entity_1 = require("../../../domain/credit/entities/credit-purchase.entity");
const credit_purchase_outbox_entity_1 = require("../../../domain/credit/entities/credit-purchase-outbox.entity");
const CREDIT_SYSTEM_CONFIG_ID = 1;
const ORDER_BY_CREATED_DESC = { createdAt: 'desc' };
let PrismaCreditRepository = class PrismaCreditRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findCreditPlanById(id) {
        const plan = await this.prisma.creditPlan.findUnique({ where: { id } });
        return plan ? this.toCreditPlan(plan) : null;
    }
    async listCreditPlans(params, onlyActive = false) {
        const where = onlyActive ? { isActive: true } : undefined;
        const [items, total] = await this.prisma.$transaction([
            this.prisma.creditPlan.findMany({
                where,
                orderBy: ORDER_BY_CREATED_DESC,
                skip: params.skip,
                take: params.limit,
            }),
            this.prisma.creditPlan.count({ where }),
        ]);
        return {
            items: items.map((plan) => this.toCreditPlan(plan)),
            total,
        };
    }
    async createCreditPlan(input) {
        const plan = await this.prisma.creditPlan.create({ data: input });
        return this.toCreditPlan(plan);
    }
    async updateCreditPlan(id, input) {
        const plan = await this.prisma.creditPlan.update({
            where: { id },
            data: input,
        });
        return this.toCreditPlan(plan);
    }
    async deleteCreditPlan(id) {
        await this.prisma.creditPlan.delete({ where: { id } });
    }
    async getCreditSystemConfig() {
        const config = await this.prisma.creditSystemConfig.upsert({
            where: { id: CREDIT_SYSTEM_CONFIG_ID },
            update: {},
            create: {
                id: CREDIT_SYSTEM_CONFIG_ID,
                registrationBonusCredits: 250,
                referralEnabled: true,
                refereeRegistrationBonusCredits: 50,
                referrerFirstPurchaseBonusCredits: 100,
            },
        });
        return this.toCreditSystemConfig(config);
    }
    async updateCreditSystemConfig(input) {
        const config = await this.prisma.creditSystemConfig.upsert({
            where: { id: CREDIT_SYSTEM_CONFIG_ID },
            update: {
                ...input,
            },
            create: {
                id: CREDIT_SYSTEM_CONFIG_ID,
                registrationBonusCredits: input.registrationBonusCredits ?? 250,
                referralEnabled: input.referralEnabled ?? true,
                refereeRegistrationBonusCredits: input.refereeRegistrationBonusCredits ?? 50,
                referrerFirstPurchaseBonusCredits: input.referrerFirstPurchaseBonusCredits ?? 100,
            },
        });
        return this.toCreditSystemConfig(config);
    }
    async createCreditPurchaseWithOutbox(input, outbox) {
        const purchase = await this.prisma.$transaction(async (tx) => {
            const createdPurchase = await tx.creditPurchase.create({
                data: {
                    userId: input.userId,
                    creditPlanId: input.creditPlanId,
                    creditsAmount: input.creditsAmount,
                    amountBrl: input.amountBrl,
                    status: credit_purchase_entity_1.CreditPurchaseStatus.PENDING,
                    provider: input.provider,
                    correlationId: input.correlationId,
                },
            });
            await tx.creditPurchaseOutbox.create({
                data: {
                    creditPurchaseId: createdPurchase.id,
                    eventType: outbox.eventType,
                    payload: this.toJsonObject(outbox.payload),
                    status: credit_purchase_outbox_entity_1.CreditPurchaseOutboxStatus.PENDING,
                },
            });
            return createdPurchase;
        });
        return this.toCreditPurchase(purchase);
    }
    async findCreditPurchaseById(id) {
        const purchase = await this.findUniqueCreditPurchase({ id });
        return purchase ? this.toCreditPurchase(purchase) : null;
    }
    async findCreditPurchaseByCorrelationId(correlationId) {
        const purchase = await this.findUniqueCreditPurchase({ correlationId });
        return purchase ? this.toCreditPurchase(purchase) : null;
    }
    async updateCreditPurchaseStatus(id, status, failureReason, stripePaymentIntentId) {
        const purchase = await this.prisma.creditPurchase.update({
            where: { id },
            data: {
                status,
                failureReason: failureReason ?? null,
                stripePaymentIntentId: stripePaymentIntentId ?? null,
            },
        });
        return this.toCreditPurchase(purchase);
    }
    async listUserCreditTransactions(userId, params) {
        const where = { userId };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.creditTransaction.findMany({
                where,
                orderBy: ORDER_BY_CREATED_DESC,
                skip: params.skip,
                take: params.limit,
            }),
            this.prisma.creditTransaction.count({ where }),
        ]);
        return {
            items: items.map((item) => this.toCreditTransaction(item)),
            total,
        };
    }
    async listUserCreditPurchases(userId, params) {
        const where = { userId };
        const [items, total] = await this.prisma.$transaction([
            this.prisma.creditPurchase.findMany({
                where,
                orderBy: ORDER_BY_CREATED_DESC,
                skip: params.skip,
                take: params.limit,
            }),
            this.prisma.creditPurchase.count({ where }),
        ]);
        return {
            items: items.map((item) => this.toCreditPurchase(item)),
            total,
        };
    }
    async adjustUserCredits(input) {
        return this.prisma.$transaction(async (tx) => {
            if (input.correlationId) {
                const existing = await tx.creditTransaction.findFirst({
                    where: {
                        userId: input.userId,
                        correlationId: input.correlationId,
                    },
                });
                if (existing) {
                    return this.toCreditTransaction(existing);
                }
            }
            const user = await tx.user.findUnique({
                where: { id: input.userId },
                select: { creditsBalance: true },
            });
            if (!user) {
                throw new Error('USER_NOT_FOUND');
            }
            const balanceBefore = user.creditsBalance;
            const balanceAfter = balanceBefore + input.amount;
            if (balanceAfter < 0) {
                throw new Error('INSUFFICIENT_CREDITS');
            }
            await tx.user.update({
                where: { id: input.userId },
                data: { creditsBalance: balanceAfter },
            });
            const transaction = await tx.creditTransaction.create({
                data: {
                    userId: input.userId,
                    type: input.type,
                    amount: input.amount,
                    balanceBefore,
                    balanceAfter,
                    description: input.description ?? null,
                    correlationId: input.correlationId ?? null,
                    metadata: input.metadata
                        ? this.toJsonObject(input.metadata)
                        : undefined,
                },
            });
            return this.toCreditTransaction(transaction);
        });
    }
    async getUserCreditsBalance(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: { creditsBalance: true },
        });
        if (!user) {
            throw new Error('USER_NOT_FOUND');
        }
        return user.creditsBalance;
    }
    async markFirstApprovedCreditPurchaseDone(userId) {
        const result = await this.prisma.user.updateMany({
            where: {
                id: userId,
                firstApprovedCreditPurchaseDone: false,
            },
            data: {
                firstApprovedCreditPurchaseDone: true,
            },
        });
        return result.count > 0;
    }
    async findOutboxEventsReadyToDispatch(batchSize, referenceDate) {
        const events = await this.prisma.creditPurchaseOutbox.findMany({
            where: {
                OR: [
                    { status: credit_purchase_outbox_entity_1.CreditPurchaseOutboxStatus.PENDING },
                    {
                        status: credit_purchase_outbox_entity_1.CreditPurchaseOutboxStatus.FAILED,
                        nextAttemptAt: { lte: referenceDate },
                    },
                ],
            },
            orderBy: { createdAt: 'asc' },
            take: batchSize,
        });
        return events.map((event) => this.toCreditOutbox(event));
    }
    async markOutboxEventAsSent(eventId) {
        await this.prisma.creditPurchaseOutbox.update({
            where: { id: eventId },
            data: {
                status: credit_purchase_outbox_entity_1.CreditPurchaseOutboxStatus.SENT,
                publishedAt: new Date(),
                nextAttemptAt: null,
                lastError: null,
            },
        });
    }
    async markOutboxEventForRetry(eventId, status, attempts, nextAttemptAt, lastError) {
        await this.prisma.creditPurchaseOutbox.update({
            where: { id: eventId },
            data: {
                status,
                attempts,
                nextAttemptAt,
                lastError,
            },
        });
    }
    async findReferralRewardLog(referrerUserId, refereeUserId, rewardType) {
        const log = await this.prisma.referralRewardLog.findFirst({
            where: {
                referrerUserId,
                refereeUserId,
                rewardType,
            },
        });
        return log ? this.toReferralRewardLog(log) : null;
    }
    async createReferralRewardLog(input) {
        const log = await this.prisma.referralRewardLog.create({
            data: {
                referrerUserId: input.referrerUserId,
                refereeUserId: input.refereeUserId,
                rewardType: input.rewardType,
                creditsGranted: input.creditsGranted,
                correlationId: input.correlationId ?? null,
            },
        });
        return this.toReferralRewardLog(log);
    }
    async findUniqueCreditPurchase(where) {
        return this.prisma.creditPurchase.findUnique({
            where,
        });
    }
    toCreditPlan(plan) {
        return {
            id: plan.id,
            name: plan.name,
            creditsAmount: plan.creditsAmount,
            priceBrl: this.toNumber(plan.priceBrl),
            isActive: plan.isActive,
            createdAt: plan.createdAt,
            updatedAt: plan.updatedAt,
        };
    }
    toCreditSystemConfig(config) {
        return {
            id: config.id,
            registrationBonusCredits: config.registrationBonusCredits,
            referralEnabled: config.referralEnabled,
            refereeRegistrationBonusCredits: config.refereeRegistrationBonusCredits,
            referrerFirstPurchaseBonusCredits: config.referrerFirstPurchaseBonusCredits,
            createdAt: config.createdAt,
            updatedAt: config.updatedAt,
        };
    }
    toCreditPurchase(purchase) {
        return {
            id: purchase.id,
            userId: purchase.userId,
            creditPlanId: purchase.creditPlanId,
            creditsAmount: purchase.creditsAmount,
            amountBrl: this.toNumber(purchase.amountBrl),
            status: purchase.status,
            provider: purchase.provider,
            correlationId: purchase.correlationId,
            stripePaymentIntentId: purchase.stripePaymentIntentId ?? null,
            failureReason: purchase.failureReason ?? null,
            createdAt: purchase.createdAt,
            updatedAt: purchase.updatedAt,
        };
    }
    toCreditOutbox(event) {
        return {
            id: event.id,
            creditPurchaseId: event.creditPurchaseId,
            eventType: event.eventType,
            payload: (event.payload ?? {}),
            status: event.status,
            attempts: event.attempts,
            nextAttemptAt: event.nextAttemptAt,
            lastError: event.lastError,
            publishedAt: event.publishedAt,
            createdAt: event.createdAt,
            updatedAt: event.updatedAt,
        };
    }
    toCreditTransaction(transaction) {
        return {
            id: transaction.id,
            userId: transaction.userId,
            type: transaction.type,
            amount: transaction.amount,
            balanceBefore: transaction.balanceBefore,
            balanceAfter: transaction.balanceAfter,
            description: transaction.description,
            correlationId: transaction.correlationId,
            metadata: (transaction.metadata ?? null),
            createdAt: transaction.createdAt,
        };
    }
    toReferralRewardLog(log) {
        return {
            id: log.id,
            referrerUserId: log.referrerUserId,
            refereeUserId: log.refereeUserId,
            rewardType: log.rewardType,
            creditsGranted: log.creditsGranted,
            correlationId: log.correlationId,
            createdAt: log.createdAt,
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
exports.PrismaCreditRepository = PrismaCreditRepository;
exports.PrismaCreditRepository = PrismaCreditRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaCreditRepository);
exports.CREDIT_REPOSITORY_PROVIDER = {
    provide: credit_repository_1.CREDIT_REPOSITORY,
    useClass: PrismaCreditRepository,
};
//# sourceMappingURL=credit.repository.js.map