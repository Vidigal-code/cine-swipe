import { Injectable } from '@nestjs/common';
import { IPurchaseRepository } from '../../../domain/payment/interfaces/purchase.repository';
import {
  Purchase,
  PurchaseStatus,
} from '../../../domain/payment/entities/purchase.entity';
import { PrismaService } from '../prisma.service';
import { UserRole } from '../../../domain/user/entities/user.entity';
import { PaginationParams } from '../../../shared/pagination/pagination.types';
import {
  CreateOutboxEventInput,
  PaymentOutbox,
  PaymentOutboxStatus,
} from '../../../domain/payment/entities/payment-outbox.entity';

const PURCHASE_INCLUDE_RELATIONS = { movie: true, user: true } as const;
const ORDER_BY_CREATED_DESC = { createdAt: 'desc' } as const;

const DEFAULT_PURCHASE_VALUES = {
  userId: '',
  movieId: '',
  amount: 0,
  provider: 'mock',
  correlationId: '',
  status: PurchaseStatus.PENDING,
} as const;

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };
type TransactionClient = Pick<PrismaService, 'purchase' | 'paymentOutbox'>;
type PurchaseUserFilter = { userId: string; status?: PurchaseStatus };
type PurchaseUniqueWhere = { id: string } | { correlationId: string };
type NumericField = number | { toNumber: () => number };

type OutboxRecord = {
  id: string;
  purchaseId: string;
  eventType: string;
  payload: unknown;
  status: string;
  attempts: number;
  nextAttemptAt: Date | null;
  lastError: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type PurchaseMovieRecord = {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  price: NumericField;
  posterUrl: string | null;
  trailerUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type PurchaseUserRecord = {
  id: string;
  username: string;
  email: string;
  passwordHash: string | null;
  firebaseUid: string | null;
  role: string;
  creditsBalance: number;
  avatarUrl: string | null;
  referralCode: string;
  referredByUserId: string | null;
  firstApprovedCreditPurchaseDone: boolean;
  referralSignupBonusGranted: boolean;
  createdAt: Date;
  updatedAt: Date;
};

type PurchaseRecord = {
  id: string;
  userId: string;
  movieId: string;
  amount: NumericField;
  status: string;
  provider: string;
  correlationId: string;
  stripePaymentIntentId: string | null;
  failureReason: string | null;
  createdAt: Date;
  updatedAt: Date;
  movie: PurchaseMovieRecord | null;
  user: PurchaseUserRecord | null;
};

@Injectable()
export class PrismaPurchaseRepository implements IPurchaseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(purchaseData: Partial<Purchase>): Promise<Purchase> {
    const purchase = await this.prisma.purchase.create({
      data: this.toCreatePurchaseInput(purchaseData),
      include: PURCHASE_INCLUDE_RELATIONS,
    });
    return this.toDomain(purchase);
  }

  async createWithOutbox(
    purchaseData: Partial<Purchase>,
    outbox: CreateOutboxEventInput,
  ): Promise<Purchase> {
    const purchase = await this.prisma.$transaction(
      async (transactionClient: TransactionClient) => {
        const createdPurchase = await this.createPurchaseRecord(
          transactionClient,
          purchaseData,
        );

        await this.createOutboxRecord(
          transactionClient,
          createdPurchase.id,
          outbox,
        );

        return createdPurchase;
      },
    );

    return this.toDomain(purchase);
  }

  async findById(id: string): Promise<Purchase | null> {
    const purchase = await this.findUniquePurchase({ id });
    return purchase ? this.toDomain(purchase) : null;
  }

  async updateStatus(id: string, status: PurchaseStatus): Promise<Purchase> {
    const purchase = await this.prisma.purchase.update({
      where: { id },
      data: { status },
      include: PURCHASE_INCLUDE_RELATIONS,
    });
    return this.toDomain(purchase);
  }

  async findByUser(userId: string): Promise<Purchase[]> {
    const purchases = await this.prisma.purchase.findMany({
      where: { userId },
      include: PURCHASE_INCLUDE_RELATIONS,
      orderBy: ORDER_BY_CREATED_DESC,
    });
    return this.toDomainList(purchases);
  }

  async findByUserPage(
    userId: string,
    params: PaginationParams,
    status?: PurchaseStatus,
  ): Promise<{ items: Purchase[]; total: number }> {
    const whereClause = this.buildUserFilter(userId, status);

    const [purchases, total] = await this.prisma.$transaction([
      this.prisma.purchase.findMany({
        where: whereClause,
        include: PURCHASE_INCLUDE_RELATIONS,
        orderBy: ORDER_BY_CREATED_DESC,
        skip: params.skip,
        take: params.limit,
      }),
      this.prisma.purchase.count({
        where: whereClause,
      }),
    ]);

    return {
      items: this.toDomainList(purchases),
      total,
    };
  }

  async findByCorrelationId(correlationId: string): Promise<Purchase | null> {
    const purchase = await this.findUniquePurchase({ correlationId });
    return purchase ? this.toDomain(purchase) : null;
  }

  async findOutboxEventsReadyToDispatch(
    batchSize: number,
    referenceDate: Date,
  ): Promise<PaymentOutbox[]> {
    const events: OutboxRecord[] = await this.prisma.paymentOutbox.findMany({
      where: {
        OR: [
          { status: PaymentOutboxStatus.PENDING },
          {
            status: PaymentOutboxStatus.FAILED,
            nextAttemptAt: {
              lte: referenceDate,
            },
          },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: batchSize,
    });

    return events.map((event: OutboxRecord) => this.toOutboxDomain(event));
  }

  async markOutboxEventAsSent(eventId: string): Promise<void> {
    await this.prisma.paymentOutbox.update({
      where: { id: eventId },
      data: {
        status: PaymentOutboxStatus.SENT,
        publishedAt: new Date(),
        lastError: null,
        nextAttemptAt: null,
      },
    });
  }

  async markOutboxEventForRetry(
    eventId: string,
    status: PaymentOutboxStatus,
    attempts: number,
    nextAttemptAt: Date | null,
    lastError: string | null,
  ): Promise<void> {
    await this.prisma.paymentOutbox.update({
      where: { id: eventId },
      data: {
        status,
        attempts,
        nextAttemptAt,
        lastError,
      },
    });
  }

  private async createPurchaseRecord(
    client: TransactionClient,
    purchaseData: Partial<Purchase>,
  ): Promise<PurchaseRecord> {
    return client.purchase.create({
      data: this.toCreatePurchaseInput(purchaseData),
      include: PURCHASE_INCLUDE_RELATIONS,
    });
  }

  private async createOutboxRecord(
    client: TransactionClient,
    purchaseId: string,
    outbox: CreateOutboxEventInput,
  ): Promise<void> {
    await client.paymentOutbox.create({
      data: {
        purchaseId,
        eventType: outbox.eventType,
        payload: this.toJsonObject(outbox.payload),
        status: PaymentOutboxStatus.PENDING,
      },
    });
  }

  private toCreatePurchaseInput(purchaseData: Partial<Purchase>) {
    return {
      userId: purchaseData.userId ?? DEFAULT_PURCHASE_VALUES.userId,
      movieId: purchaseData.movieId ?? DEFAULT_PURCHASE_VALUES.movieId,
      amount: purchaseData.amount ?? DEFAULT_PURCHASE_VALUES.amount,
      status: purchaseData.status ?? DEFAULT_PURCHASE_VALUES.status,
      provider: purchaseData.provider ?? DEFAULT_PURCHASE_VALUES.provider,
      correlationId:
        purchaseData.correlationId ?? DEFAULT_PURCHASE_VALUES.correlationId,
    };
  }

  private async findUniquePurchase(
    where: PurchaseUniqueWhere,
  ): Promise<PurchaseRecord | null> {
    return this.prisma.purchase.findUnique({
      where,
      include: PURCHASE_INCLUDE_RELATIONS,
    });
  }

  private buildUserFilter(
    userId: string,
    status?: PurchaseStatus,
  ): PurchaseUserFilter {
    return status ? { userId, status } : { userId };
  }

  private toDomainList(purchases: PurchaseRecord[]): Purchase[] {
    return purchases.map((purchase: PurchaseRecord) => this.toDomain(purchase));
  }

  private toDomain(purchase: PurchaseRecord): Purchase {
    return {
      id: purchase.id,
      userId: purchase.userId,
      movieId: purchase.movieId,
      amount: this.toNumber(purchase.amount),
      status: purchase.status as PurchaseStatus,
      provider: purchase.provider,
      correlationId: purchase.correlationId,
      stripePaymentIntentId: purchase.stripePaymentIntentId ?? null,
      failureReason: purchase.failureReason ?? null,
      createdAt: purchase.createdAt,
      updatedAt: purchase.updatedAt,
      movie: purchase.movie
        ? {
            ...purchase.movie,
            price: this.toNumber(purchase.movie.price),
          }
        : null,
      user: purchase.user
        ? {
            ...purchase.user,
            role: purchase.user.role as UserRole,
          }
        : null,
    };
  }

  private toOutboxDomain(event: OutboxRecord): PaymentOutbox {
    return {
      id: event.id,
      purchaseId: event.purchaseId,
      eventType: event.eventType,
      payload: event.payload as Record<string, unknown>,
      status: event.status as PaymentOutboxStatus,
      attempts: event.attempts,
      nextAttemptAt: event.nextAttemptAt,
      lastError: event.lastError,
      publishedAt: event.publishedAt,
      createdAt: event.createdAt,
      updatedAt: event.updatedAt,
    };
  }

  private toNumber(value: NumericField): number {
    return typeof value === 'number' ? value : value.toNumber();
  }

  private toJsonObject(value: Record<string, unknown>): JsonObject {
    const entries = Object.entries(value).map(([key, entryValue]) => [
      key,
      this.toJsonValue(entryValue),
    ]);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return Object.fromEntries(entries);
  }

  private toJsonValue(value: unknown): JsonValue {
    if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.toJsonValue(item));
    }

    if (typeof value === 'object') {
      return this.toJsonObject(value as Record<string, unknown>);
    }

    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    return String(value);
  }
}
