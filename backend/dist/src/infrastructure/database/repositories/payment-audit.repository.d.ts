import { PrismaService } from '../prisma.service';
import { CreatePaymentAuditInput, PaymentAudit } from '../../../domain/payment/entities/payment-audit.entity';
import { IPaymentAuditRepository } from '../../../domain/payment/interfaces/payment-audit.repository';
import { PaginationParams } from '../../../shared/pagination/pagination.types';
export declare class PrismaPaymentAuditRepository implements IPaymentAuditRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    create(input: CreatePaymentAuditInput): Promise<PaymentAudit>;
    findPage(params: PaginationParams): Promise<{
        items: PaymentAudit[];
        total: number;
    }>;
    private toDomain;
    private toNumber;
}
