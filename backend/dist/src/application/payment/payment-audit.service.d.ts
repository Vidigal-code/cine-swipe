import { PaymentAudit, PaymentAuditEventType, PaymentAuditSource } from '../../domain/payment/entities/payment-audit.entity';
import { Purchase } from '../../domain/payment/entities/purchase.entity';
import type { IPaymentAuditRepository } from '../../domain/payment/interfaces/payment-audit.repository';
import { PaginationService } from '../../shared/pagination/pagination.service';
import { PaginatedResult, PaginationQueryInput } from '../../shared/pagination/pagination.types';
export declare class PaymentAuditService {
    private readonly paymentAuditRepository;
    private readonly paginationService;
    constructor(paymentAuditRepository: IPaymentAuditRepository, paginationService: PaginationService);
    captureFromPurchase(purchase: Purchase, eventType: PaymentAuditEventType, source: PaymentAuditSource, message?: string): Promise<void>;
    getAuditPage(paginationQuery: PaginationQueryInput): Promise<PaginatedResult<PaymentAudit>>;
    private resolveUserName;
    private resolveUserEmail;
    private resolveMovieTitle;
}
