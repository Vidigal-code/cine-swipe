import { CreditPlan } from '../entities/credit-plan.entity';
import { CreditSystemConfig } from '../entities/credit-system-config.entity';
import { CreditPurchase, CreditPurchaseStatus } from '../entities/credit-purchase.entity';
import { CreateCreditOutboxEventInput, CreditPurchaseOutbox, CreditPurchaseOutboxStatus } from '../entities/credit-purchase-outbox.entity';
import { CreditTransaction, CreditTransactionType } from '../entities/credit-transaction.entity';
import { ReferralRewardLog, ReferralRewardType } from '../entities/referral-reward-log.entity';
import { PaginationParams } from '../../../shared/pagination/pagination.types';
export declare const CREDIT_REPOSITORY = "CREDIT_REPOSITORY";
export interface CreateCreditPurchaseInput {
    userId: string;
    creditPlanId: string;
    creditsAmount: number;
    amountBrl: number;
    provider: string;
    correlationId: string;
}
export interface AdjustCreditsInput {
    userId: string;
    amount: number;
    type: CreditTransactionType;
    description?: string;
    correlationId?: string;
    metadata?: Record<string, unknown>;
}
export interface CreateCreditPlanInput {
    name: string;
    creditsAmount: number;
    priceBrl: number;
    isActive: boolean;
}
export interface UpdateCreditPlanInput {
    name?: string;
    creditsAmount?: number;
    priceBrl?: number;
    isActive?: boolean;
}
export interface UpdateCreditSystemConfigInput {
    registrationBonusCredits?: number;
    referralEnabled?: boolean;
    refereeRegistrationBonusCredits?: number;
    referrerFirstPurchaseBonusCredits?: number;
}
export interface ICreditRepository {
    findCreditPlanById(id: string): Promise<CreditPlan | null>;
    listCreditPlans(params: PaginationParams, onlyActive?: boolean): Promise<{
        items: CreditPlan[];
        total: number;
    }>;
    createCreditPlan(input: CreateCreditPlanInput): Promise<CreditPlan>;
    updateCreditPlan(id: string, input: UpdateCreditPlanInput): Promise<CreditPlan>;
    deleteCreditPlan(id: string): Promise<void>;
    getCreditSystemConfig(): Promise<CreditSystemConfig>;
    updateCreditSystemConfig(input: UpdateCreditSystemConfigInput): Promise<CreditSystemConfig>;
    createCreditPurchaseWithOutbox(input: CreateCreditPurchaseInput, outbox: CreateCreditOutboxEventInput): Promise<CreditPurchase>;
    findCreditPurchaseById(id: string): Promise<CreditPurchase | null>;
    findCreditPurchaseByCorrelationId(correlationId: string): Promise<CreditPurchase | null>;
    updateCreditPurchaseStatus(id: string, status: CreditPurchaseStatus, failureReason?: string | null, stripePaymentIntentId?: string | null): Promise<CreditPurchase>;
    listUserCreditTransactions(userId: string, params: PaginationParams): Promise<{
        items: CreditTransaction[];
        total: number;
    }>;
    listUserCreditPurchases(userId: string, params: PaginationParams): Promise<{
        items: CreditPurchase[];
        total: number;
    }>;
    adjustUserCredits(input: AdjustCreditsInput): Promise<CreditTransaction>;
    getUserCreditsBalance(userId: string): Promise<number>;
    markFirstApprovedCreditPurchaseDone(userId: string): Promise<boolean>;
    findOutboxEventsReadyToDispatch(batchSize: number, referenceDate: Date): Promise<CreditPurchaseOutbox[]>;
    markOutboxEventAsSent(eventId: string): Promise<void>;
    markOutboxEventForRetry(eventId: string, status: CreditPurchaseOutboxStatus, attempts: number, nextAttemptAt: Date | null, lastError: string | null): Promise<void>;
    findReferralRewardLog(referrerUserId: string, refereeUserId: string, rewardType: ReferralRewardType): Promise<ReferralRewardLog | null>;
    createReferralRewardLog(input: {
        referrerUserId: string;
        refereeUserId: string;
        rewardType: ReferralRewardType;
        creditsGranted: number;
        correlationId?: string;
    }): Promise<ReferralRewardLog>;
}
