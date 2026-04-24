import { IPurchaseRepository } from '../../../domain/payment/interfaces/purchase.repository';
import { Purchase, PurchaseStatus } from '../../../domain/payment/entities/purchase.entity';
import { PrismaService } from '../prisma.service';
import { PaginationParams } from '../../../shared/pagination/pagination.types';
import { CreateOutboxEventInput, PaymentOutbox, PaymentOutboxStatus } from '../../../domain/payment/entities/payment-outbox.entity';
export declare class PrismaPurchaseRepository implements IPurchaseRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(purchaseData: Partial<Purchase>): Promise<Purchase>;
    createWithOutbox(purchaseData: Partial<Purchase>, outbox: CreateOutboxEventInput): Promise<Purchase>;
    findById(id: string): Promise<Purchase | null>;
    updateStatus(id: string, status: PurchaseStatus): Promise<Purchase>;
    findByUser(userId: string): Promise<Purchase[]>;
    findByUserPage(userId: string, params: PaginationParams, status?: PurchaseStatus): Promise<{
        items: Purchase[];
        total: number;
    }>;
    findByCorrelationId(correlationId: string): Promise<Purchase | null>;
    findOutboxEventsReadyToDispatch(batchSize: number, referenceDate: Date): Promise<PaymentOutbox[]>;
    markOutboxEventAsSent(eventId: string): Promise<void>;
    markOutboxEventForRetry(eventId: string, status: PaymentOutboxStatus, attempts: number, nextAttemptAt: Date | null, lastError: string | null): Promise<void>;
    private createPurchaseRecord;
    private createOutboxRecord;
    private toCreatePurchaseInput;
    private findUniquePurchase;
    private buildUserFilter;
    private toDomainList;
    private toDomain;
    private toOutboxDomain;
    private toNumber;
    private toJsonObject;
    private toJsonValue;
}
