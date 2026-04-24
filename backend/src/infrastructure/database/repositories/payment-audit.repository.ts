import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import {
  CreatePaymentAuditInput,
  PaymentAudit,
  PaymentAuditEventType,
  PaymentAuditSource,
} from '../../../domain/payment/entities/payment-audit.entity';
import { IPaymentAuditRepository } from '../../../domain/payment/interfaces/payment-audit.repository';
import { PurchaseStatus } from '../../../domain/payment/entities/purchase.entity';
import { PaginationParams } from '../../../shared/pagination/pagination.types';

type NumericField = number | { toNumber: () => number };

type PaymentAuditRecord = {
  id: string;
  purchaseId: string;
  userId: string;
  userName: string;
  userEmail: string;
  movieId: string;
  movieTitle: string;
  amount: NumericField;
  provider: string;
  status: string;
  correlationId: string;
  stripePaymentIntentId: string | null;
  eventType: string;
  source: string;
  message: string | null;
  createdAt: Date;
};

@Injectable()
export class PrismaPaymentAuditRepository implements IPaymentAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreatePaymentAuditInput): Promise<PaymentAudit> {
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

  async findPage(
    params: PaginationParams,
  ): Promise<{ items: PaymentAudit[]; total: number }> {
    const [items, total] = await this.prisma.$transaction([
      this.prisma.paymentAudit.findMany({
        orderBy: { createdAt: 'desc' },
        skip: params.skip,
        take: params.limit,
      }),
      this.prisma.paymentAudit.count(),
    ]);

    return {
      items: (items as PaymentAuditRecord[]).map((item) => this.toDomain(item)),
      total,
    };
  }

  private toDomain(record: PaymentAuditRecord): PaymentAudit {
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
      status: record.status as PurchaseStatus,
      correlationId: record.correlationId,
      stripePaymentIntentId: record.stripePaymentIntentId,
      eventType: record.eventType as PaymentAuditEventType,
      source: record.source as PaymentAuditSource,
      message: record.message,
      createdAt: record.createdAt,
    };
  }

  private toNumber(value: NumericField): number {
    return typeof value === 'number' ? value : value.toNumber();
  }
}
