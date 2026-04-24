import { Inject, Injectable } from '@nestjs/common';
import {
  PaymentAudit,
  PaymentAuditEventType,
  PaymentAuditSource,
} from '../../domain/payment/entities/payment-audit.entity';
import { Purchase } from '../../domain/payment/entities/purchase.entity';
import { PAYMENT_AUDIT_REPOSITORY } from '../../domain/payment/interfaces/payment-audit.repository';
import type { IPaymentAuditRepository } from '../../domain/payment/interfaces/payment-audit.repository';
import { PaginationService } from '../../shared/pagination/pagination.service';
import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../shared/pagination/pagination.types';
import {
  PAYMENT_AUDIT_UNKNOWN_MOVIE_TITLE,
  PAYMENT_AUDIT_UNKNOWN_USER_EMAIL,
  PAYMENT_AUDIT_UNKNOWN_USER_NAME,
} from '../../shared/payment/payment-audit.constants';

@Injectable()
export class PaymentAuditService {
  constructor(
    @Inject(PAYMENT_AUDIT_REPOSITORY)
    private readonly paymentAuditRepository: IPaymentAuditRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async captureFromPurchase(
    purchase: Purchase,
    eventType: PaymentAuditEventType,
    source: PaymentAuditSource,
    message?: string,
  ): Promise<void> {
    await this.paymentAuditRepository.create({
      purchaseId: purchase.id,
      userId: purchase.userId,
      userName: this.resolveUserName(purchase),
      userEmail: this.resolveUserEmail(purchase),
      movieId: purchase.movieId,
      movieTitle: this.resolveMovieTitle(purchase),
      amount: purchase.amount,
      provider: purchase.provider,
      status: purchase.status,
      correlationId: purchase.correlationId,
      stripePaymentIntentId: purchase.stripePaymentIntentId,
      eventType,
      source,
      message,
    });
  }

  async getAuditPage(
    paginationQuery: PaginationQueryInput,
  ): Promise<PaginatedResult<PaymentAudit>> {
    const pagination = this.paginationService.resolve(paginationQuery);
    const { items, total } =
      await this.paymentAuditRepository.findPage(pagination);
    return this.paginationService.buildResult(items, total, pagination);
  }

  private resolveUserName(purchase: Purchase): string {
    if (purchase.user?.username) {
      return purchase.user.username;
    }
    if (purchase.user?.email) {
      return purchase.user.email.split('@')[0];
    }
    return PAYMENT_AUDIT_UNKNOWN_USER_NAME;
  }

  private resolveUserEmail(purchase: Purchase): string {
    return purchase.user?.email ?? PAYMENT_AUDIT_UNKNOWN_USER_EMAIL;
  }

  private resolveMovieTitle(purchase: Purchase): string {
    return purchase.movie?.title ?? PAYMENT_AUDIT_UNKNOWN_MOVIE_TITLE;
  }
}
