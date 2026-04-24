import { PrismaService } from '../prisma.service';
import { AdjustCreditsInput, CreateCreditPlanInput, CreateCreditPurchaseInput, ICreditRepository, UpdateCreditPlanInput, UpdateCreditSystemConfigInput } from '../../../domain/credit/interfaces/credit.repository';
import { CreditPlan } from '../../../domain/credit/entities/credit-plan.entity';
import { CreditSystemConfig } from '../../../domain/credit/entities/credit-system-config.entity';
import { CreditPurchase, CreditPurchaseStatus } from '../../../domain/credit/entities/credit-purchase.entity';
import { CreateCreditOutboxEventInput, CreditPurchaseOutbox, CreditPurchaseOutboxStatus } from '../../../domain/credit/entities/credit-purchase-outbox.entity';
import { CreditTransaction } from '../../../domain/credit/entities/credit-transaction.entity';
import { ReferralRewardLog, ReferralRewardType } from '../../../domain/credit/entities/referral-reward-log.entity';
import { PaginationParams } from '../../../shared/pagination/pagination.types';
export declare class PrismaCreditRepository implements ICreditRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
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
    private findUniqueCreditPurchase;
    private toCreditPlan;
    private toCreditSystemConfig;
    private toCreditPurchase;
    private toCreditOutbox;
    private toCreditTransaction;
    private toReferralRewardLog;
    private toNumber;
    private toJsonObject;
    private toJsonValue;
}
export declare const CREDIT_REPOSITORY_PROVIDER: {
    provide: string;
    useClass: typeof PrismaCreditRepository;
};
