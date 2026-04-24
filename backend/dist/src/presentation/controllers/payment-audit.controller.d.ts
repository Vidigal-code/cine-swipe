import { PaymentAuditService } from '../../application/payment/payment-audit.service';
import { PaginationQueryDto } from '../../shared/pagination/pagination-query.dto';
import { PaymentAudit } from '../../domain/payment/entities/payment-audit.entity';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import type { PaginatedResponse } from '../../shared/http-response/response.types';
export declare class PaymentAuditController {
    private readonly paymentAuditService;
    private readonly responseFactory;
    constructor(paymentAuditService: PaymentAuditService, responseFactory: ResponseFactory);
    listAudits(query: PaginationQueryDto): Promise<PaginatedResponse<PaymentAudit>>;
}
