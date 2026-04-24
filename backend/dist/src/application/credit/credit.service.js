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
exports.CreditService = exports.CREDIT_CHECKOUT_FAILED_EVENT = exports.CREDIT_CHECKOUT_REQUESTED_EVENT = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const pagination_service_1 = require("../../shared/pagination/pagination.service");
const credit_repository_1 = require("../../domain/credit/interfaces/credit.repository");
const credit_purchase_entity_1 = require("../../domain/credit/entities/credit-purchase.entity");
const credit_transaction_entity_1 = require("../../domain/credit/entities/credit-transaction.entity");
const user_repository_1 = require("../../domain/user/interfaces/user.repository");
const credit_messages_pt_br_1 = require("../../shared/credit/credit-messages.pt-br");
const payment_gateway_factory_1 = require("../../infrastructure/payment/payment-gateway.factory");
const api_logger_1 = require("../../shared/logger/api-logger");
const referral_reward_log_entity_1 = require("../../domain/credit/entities/referral-reward-log.entity");
exports.CREDIT_CHECKOUT_REQUESTED_EVENT = 'credit.checkout.requested';
exports.CREDIT_CHECKOUT_FAILED_EVENT = 'credit.checkout.failed';
const CREDIT_LOGGER_CONTEXT = 'CreditService';
let CreditService = class CreditService {
    creditRepository;
    userRepository;
    paymentGatewayFactory;
    paginationService;
    constructor(creditRepository, userRepository, paymentGatewayFactory, paginationService) {
        this.creditRepository = creditRepository;
        this.userRepository = userRepository;
        this.paymentGatewayFactory = paymentGatewayFactory;
        this.paginationService = paginationService;
    }
    async getUserBalance(userId) {
        return this.creditRepository.getUserCreditsBalance(userId);
    }
    async getUserTransactionsPage(userId, paginationQuery) {
        const params = this.paginationService.resolve(paginationQuery);
        const { items, total } = await this.creditRepository.listUserCreditTransactions(userId, params);
        return this.paginationService.buildResult(items, total, params);
    }
    async getUserCreditPurchasesPage(userId, paginationQuery) {
        const params = this.paginationService.resolve(paginationQuery);
        const { items, total } = await this.creditRepository.listUserCreditPurchases(userId, params);
        return this.paginationService.buildResult(items, total, params);
    }
    async getActivePlansPage(paginationQuery) {
        const params = this.paginationService.resolve(paginationQuery);
        const { items, total } = await this.creditRepository.listCreditPlans(params, true);
        return this.paginationService.buildResult(items, total, params);
    }
    async createCheckout(userId, creditPlanId) {
        const plan = await this.creditRepository.findCreditPlanById(creditPlanId);
        if (!plan || !plan.isActive) {
            throw new common_1.NotFoundException(credit_messages_pt_br_1.CREDIT_MESSAGES_PT_BR.planNotFound);
        }
        const provider = this.paymentGatewayFactory.resolveDefaultProvider();
        const correlationId = (0, crypto_1.randomUUID)();
        const purchase = await this.creditRepository.createCreditPurchaseWithOutbox({
            userId,
            creditPlanId: plan.id,
            creditsAmount: plan.creditsAmount,
            amountBrl: plan.priceBrl,
            provider,
            correlationId,
        }, {
            eventType: exports.CREDIT_CHECKOUT_REQUESTED_EVENT,
            payload: {
                creditsAmount: plan.creditsAmount,
                amountBrl: plan.priceBrl,
                provider,
                correlationId,
                retryCount: 0,
            },
        });
        return purchase;
    }
    async markCheckoutLookup(purchaseId) {
        return this.creditRepository.findCreditPurchaseById(purchaseId);
    }
    async markCheckoutCompleted(purchaseId, externalReference) {
        const purchase = await this.creditRepository.findCreditPurchaseById(purchaseId);
        if (!purchase) {
            throw new common_1.NotFoundException(credit_messages_pt_br_1.CREDIT_MESSAGES_PT_BR.creditPurchaseNotFound);
        }
        const updated = await this.creditRepository.updateCreditPurchaseStatus(purchase.id, credit_purchase_entity_1.CreditPurchaseStatus.COMPLETED, null, externalReference);
        await this.creditRepository.adjustUserCredits({
            userId: purchase.userId,
            amount: purchase.creditsAmount,
            type: credit_transaction_entity_1.CreditTransactionType.CREDIT_PURCHASE,
            correlationId: `credit-purchase:${purchase.id}`,
            description: 'Credito aprovado por compra de plano',
            metadata: {
                creditPurchaseId: purchase.id,
                creditPlanId: purchase.creditPlanId,
                amountBrl: purchase.amountBrl,
            },
        });
        await this.tryRewardReferrerOnFirstPurchase(purchase.userId, purchase.id);
        return updated;
    }
    async markCheckoutFailed(purchaseId, reason, externalReference) {
        const purchase = await this.creditRepository.findCreditPurchaseById(purchaseId);
        if (!purchase) {
            throw new common_1.NotFoundException(credit_messages_pt_br_1.CREDIT_MESSAGES_PT_BR.creditPurchaseNotFound);
        }
        return this.creditRepository.updateCreditPurchaseStatus(purchase.id, credit_purchase_entity_1.CreditPurchaseStatus.FAILED, reason, externalReference);
    }
    async consumeCredits(userId, amount, description, correlationId) {
        this.validatePositiveCredits(amount);
        try {
            await this.creditRepository.adjustUserCredits({
                userId,
                amount: -amount,
                type: credit_transaction_entity_1.CreditTransactionType.CREDIT_CONSUMPTION,
                description,
                correlationId,
            });
        }
        catch (error) {
            if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
                throw new common_1.BadRequestException(credit_messages_pt_br_1.CREDIT_MESSAGES_PT_BR.insufficientCredits);
            }
            throw error;
        }
    }
    async applyRegistrationBonuses(userId) {
        const user = await this.getUserOrFail(userId);
        const config = await this.creditRepository.getCreditSystemConfig();
        if (config.registrationBonusCredits > 0) {
            await this.creditRepository.adjustUserCredits({
                userId,
                amount: config.registrationBonusCredits,
                type: credit_transaction_entity_1.CreditTransactionType.REGISTRATION_BONUS,
                correlationId: `registration:${userId}:base`,
                description: 'Bonus de cadastro',
            });
        }
        if (!config.referralEnabled ||
            !user.referredByUserId ||
            user.referralSignupBonusGranted) {
            return;
        }
        if (config.refereeRegistrationBonusCredits > 0) {
            await this.creditRepository.adjustUserCredits({
                userId,
                amount: config.refereeRegistrationBonusCredits,
                type: credit_transaction_entity_1.CreditTransactionType.REFEREE_REGISTRATION_BONUS,
                correlationId: `registration:${userId}:referee`,
                description: 'Bonus de cadastro por indicacao',
            });
        }
        const existing = await this.creditRepository.findReferralRewardLog(user.referredByUserId, user.id, referral_reward_log_entity_1.ReferralRewardType.REFEREE_REGISTRATION);
        if (!existing) {
            await this.creditRepository.createReferralRewardLog({
                referrerUserId: user.referredByUserId,
                refereeUserId: user.id,
                rewardType: referral_reward_log_entity_1.ReferralRewardType.REFEREE_REGISTRATION,
                creditsGranted: config.refereeRegistrationBonusCredits,
                correlationId: `registration:${user.id}:referee`,
            });
        }
        await this.userRepository.update(user.id, {
            referralSignupBonusGranted: true,
        });
    }
    async listAdminPlansPage(paginationQuery) {
        const params = this.paginationService.resolve(paginationQuery);
        const { items, total } = await this.creditRepository.listCreditPlans(params, false);
        return this.paginationService.buildResult(items, total, params);
    }
    async createAdminPlan(input) {
        this.validateCreditPlanPayload(input);
        return this.creditRepository.createCreditPlan(input);
    }
    async updateAdminPlan(id, input) {
        if (input.creditsAmount !== undefined) {
            this.validatePositiveCredits(input.creditsAmount);
        }
        if (input.priceBrl !== undefined) {
            this.validatePriceBrl(input.priceBrl);
        }
        if (input.name !== undefined && !input.name.trim()) {
            throw new common_1.BadRequestException(credit_messages_pt_br_1.CREDIT_MESSAGES_PT_BR.creditPlanNameRequired);
        }
        return this.creditRepository.updateCreditPlan(id, input);
    }
    async deleteAdminPlan(id) {
        await this.creditRepository.deleteCreditPlan(id);
    }
    async getAdminConfig() {
        return this.creditRepository.getCreditSystemConfig();
    }
    async updateAdminConfig(input) {
        this.validateConfigInput(input);
        return this.creditRepository.updateCreditSystemConfig(input);
    }
    async tryRewardReferrerOnFirstPurchase(refereeUserId, creditPurchaseId) {
        const config = await this.creditRepository.getCreditSystemConfig();
        if (!config.referralEnabled ||
            config.referrerFirstPurchaseBonusCredits <= 0) {
            return;
        }
        const referee = await this.userRepository.findById(refereeUserId);
        if (!referee?.referredByUserId) {
            return;
        }
        const becameFirstPurchase = await this.creditRepository.markFirstApprovedCreditPurchaseDone(referee.id);
        if (!becameFirstPurchase) {
            return;
        }
        const existing = await this.creditRepository.findReferralRewardLog(referee.referredByUserId, referee.id, referral_reward_log_entity_1.ReferralRewardType.REFERRER_FIRST_PURCHASE);
        if (existing) {
            return;
        }
        await this.creditRepository.adjustUserCredits({
            userId: referee.referredByUserId,
            amount: config.referrerFirstPurchaseBonusCredits,
            type: credit_transaction_entity_1.CreditTransactionType.REFERRER_FIRST_PURCHASE_BONUS,
            correlationId: `referrer-first-purchase:${referee.id}`,
            description: 'Bonus por primeira compra do indicado',
            metadata: {
                refereeUserId: referee.id,
                creditPurchaseId,
            },
        });
        await this.creditRepository.createReferralRewardLog({
            referrerUserId: referee.referredByUserId,
            refereeUserId: referee.id,
            rewardType: referral_reward_log_entity_1.ReferralRewardType.REFERRER_FIRST_PURCHASE,
            creditsGranted: config.referrerFirstPurchaseBonusCredits,
            correlationId: `referrer-first-purchase:${referee.id}`,
        });
        api_logger_1.ApiLogger.log(`Bonus de indicacao aplicado para referrer=${referee.referredByUserId} referee=${referee.id}`, CREDIT_LOGGER_CONTEXT);
    }
    async getUserOrFail(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.NotFoundException(credit_messages_pt_br_1.CREDIT_MESSAGES_PT_BR.userNotFound);
        }
        return user;
    }
    validateCreditPlanPayload(input) {
        if (!input.name.trim()) {
            throw new common_1.BadRequestException(credit_messages_pt_br_1.CREDIT_MESSAGES_PT_BR.creditPlanNameRequired);
        }
        this.validatePositiveCredits(input.creditsAmount);
        this.validatePriceBrl(input.priceBrl);
    }
    validateConfigInput(input) {
        if (input.registrationBonusCredits !== undefined) {
            this.validateNonNegativeCredits(input.registrationBonusCredits);
        }
        if (input.refereeRegistrationBonusCredits !== undefined) {
            this.validateNonNegativeCredits(input.refereeRegistrationBonusCredits);
        }
        if (input.referrerFirstPurchaseBonusCredits !== undefined) {
            this.validateNonNegativeCredits(input.referrerFirstPurchaseBonusCredits);
        }
    }
    validatePositiveCredits(value) {
        if (!Number.isInteger(value) || value <= 0) {
            throw new common_1.BadRequestException(credit_messages_pt_br_1.CREDIT_MESSAGES_PT_BR.invalidCreditAmount);
        }
    }
    validateNonNegativeCredits(value) {
        if (!Number.isInteger(value) || value < 0) {
            throw new common_1.BadRequestException(credit_messages_pt_br_1.CREDIT_MESSAGES_PT_BR.invalidCreditAmount);
        }
    }
    validatePriceBrl(value) {
        if (!Number.isFinite(value) || value <= 0) {
            throw new common_1.BadRequestException(credit_messages_pt_br_1.CREDIT_MESSAGES_PT_BR.invalidPriceBrl);
        }
    }
};
exports.CreditService = CreditService;
exports.CreditService = CreditService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(credit_repository_1.CREDIT_REPOSITORY)),
    __param(1, (0, common_1.Inject)(user_repository_1.USER_REPOSITORY)),
    __metadata("design:paramtypes", [Object, Object, payment_gateway_factory_1.PaymentGatewayFactory,
        pagination_service_1.PaginationService])
], CreditService);
//# sourceMappingURL=credit.service.js.map