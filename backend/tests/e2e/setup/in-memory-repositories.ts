import { randomUUID } from 'crypto';
import { Movie } from '../../../src/domain/movie/entities/movie.entity';
import type { IMovieRepository } from '../../../src/domain/movie/interfaces/movie.repository';
import {
  CreatePaymentAuditInput,
  PaymentAudit,
} from '../../../src/domain/payment/entities/payment-audit.entity';
import {
  PaymentOutbox,
  PaymentOutboxStatus,
  type CreateOutboxEventInput,
} from '../../../src/domain/payment/entities/payment-outbox.entity';
import {
  Purchase,
  PurchaseStatus,
} from '../../../src/domain/payment/entities/purchase.entity';
import type { IPurchaseRepository } from '../../../src/domain/payment/interfaces/purchase.repository';
import type { IPaymentAuditRepository } from '../../../src/domain/payment/interfaces/payment-audit.repository';
import { User, UserRole } from '../../../src/domain/user/entities/user.entity';
import type { IUserRepository } from '../../../src/domain/user/interfaces/user.repository';
import type { PaginationParams } from '../../../src/shared/pagination/pagination.types';

type PurchaseRecord = Omit<Purchase, 'movie' | 'user'> & {
  stripePaymentIntentId: string | null;
  failureReason: string | null;
};

interface InMemoryStore {
  users: Map<string, User>;
  movies: Map<string, Movie>;
  purchases: Map<string, PurchaseRecord>;
  outboxEvents: Map<string, PaymentOutbox>;
  paymentAudits: Map<string, PaymentAudit>;
}

const DEFAULT_MOVIE_ORDER = (first: Movie, second: Movie) =>
  second.createdAt.getTime() - first.createdAt.getTime();

const DEFAULT_PURCHASE_ORDER = (
  first: PurchaseRecord,
  second: PurchaseRecord,
) => second.createdAt.getTime() - first.createdAt.getTime();

export function createInMemoryRepositories() {
  const store: InMemoryStore = {
    users: new Map<string, User>(),
    movies: new Map<string, Movie>(),
    purchases: new Map<string, PurchaseRecord>(),
    outboxEvents: new Map<string, PaymentOutbox>(),
    paymentAudits: new Map<string, PaymentAudit>(),
  };

  return {
    store,
    userRepository: new InMemoryUserRepository(store),
    movieRepository: new InMemoryMovieRepository(store),
    purchaseRepository: new InMemoryPurchaseRepository(store),
    paymentAuditRepository: new InMemoryPaymentAuditRepository(store),
  };
}

class InMemoryUserRepository implements IUserRepository {
  constructor(private readonly store: InMemoryStore) {}

  async create(user: Partial<User>): Promise<User> {
    const now = new Date();
    const created: User = {
      id: user.id ?? randomUUID(),
      username: user.username ?? this.resolveUsername(user.email),
      email: user.email ?? `${randomUUID()}@mail.local`,
      passwordHash: user.passwordHash ?? null,
      firebaseUid: user.firebaseUid ?? null,
      role: user.role ?? UserRole.USER,
      creditsBalance: user.creditsBalance ?? 0,
      avatarUrl: user.avatarUrl ?? null,
      referralCode: user.referralCode ?? `ref_${randomUUID().slice(0, 8)}`,
      referredByUserId: user.referredByUserId ?? null,
      firstApprovedCreditPurchaseDone:
        user.firstApprovedCreditPurchaseDone ?? false,
      referralSignupBonusGranted: user.referralSignupBonusGranted ?? false,
      createdAt: user.createdAt ?? now,
      updatedAt: user.updatedAt ?? now,
    };

    this.store.users.set(created.id, created);
    return { ...created };
  }

  async findByEmail(email: string): Promise<User | null> {
    const found = [...this.store.users.values()].find(
      (user) => user.email === email,
    );
    return found ? { ...found } : null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const found = [...this.store.users.values()].find(
      (user) => user.username === username,
    );
    return found ? { ...found } : null;
  }

  async findById(id: string): Promise<User | null> {
    const found = this.store.users.get(id);
    return found ? { ...found } : null;
  }

  async findByFirebaseUid(firebaseUid: string): Promise<User | null> {
    const found = [...this.store.users.values()].find(
      (user) => user.firebaseUid === firebaseUid,
    );
    return found ? { ...found } : null;
  }

  async findByReferralCode(referralCode: string): Promise<User | null> {
    const found = [...this.store.users.values()].find(
      (user) => user.referralCode === referralCode,
    );
    return found ? { ...found } : null;
  }

  async findPage(
    params: PaginationParams,
  ): Promise<{ items: User[]; total: number }> {
    const ordered = [...this.store.users.values()].sort(
      (first, second) => second.createdAt.getTime() - first.createdAt.getTime(),
    );
    const items = ordered
      .slice(params.skip, params.skip + params.limit)
      .map((user) => ({ ...user }));
    return {
      items,
      total: ordered.length,
    };
  }

  async countByRole(role: UserRole): Promise<number> {
    return [...this.store.users.values()].filter((user) => user.role === role)
      .length;
  }

  async update(id: string, user: Partial<User>): Promise<User> {
    const existing = this.store.users.get(id);
    if (!existing) {
      throw new Error(`User ${id} not found`);
    }

    const updated: User = {
      ...existing,
      ...user,
      id: existing.id,
      updatedAt: new Date(),
    };
    this.store.users.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.store.users.delete(id);
  }

  private resolveUsername(email: string | undefined): string {
    if (!email) {
      return `user_${randomUUID().slice(0, 8)}`;
    }
    return email.split('@')[0].slice(0, 40);
  }
}

class InMemoryMovieRepository implements IMovieRepository {
  constructor(private readonly store: InMemoryStore) {}

  async create(movie: Partial<Movie>): Promise<Movie> {
    const now = new Date();
    const created: Movie = {
      id: movie.id ?? randomUUID(),
      title: movie.title ?? '',
      synopsis: movie.synopsis ?? '',
      genre: movie.genre ?? '',
      price: movie.price ?? 0,
      posterUrl: movie.posterUrl ?? null,
      trailerUrl: movie.trailerUrl ?? null,
      createdAt: movie.createdAt ?? now,
      updatedAt: movie.updatedAt ?? now,
    };

    this.store.movies.set(created.id, created);
    return { ...created };
  }

  async findAll(): Promise<Movie[]> {
    return [...this.store.movies.values()]
      .sort(DEFAULT_MOVIE_ORDER)
      .map((movie) => ({ ...movie }));
  }

  async findPage(
    params: PaginationParams,
  ): Promise<{ items: Movie[]; total: number }> {
    const all = [...this.store.movies.values()].sort(DEFAULT_MOVIE_ORDER);
    const items = all
      .slice(params.skip, params.skip + params.limit)
      .map((movie) => ({ ...movie }));
    return { items, total: all.length };
  }

  async findById(id: string): Promise<Movie | null> {
    const movie = this.store.movies.get(id);
    return movie ? { ...movie } : null;
  }

  async update(id: string, movie: Partial<Movie>): Promise<Movie> {
    const existing = this.store.movies.get(id);
    if (!existing) {
      throw new Error(`Movie ${id} not found`);
    }

    const updated: Movie = {
      ...existing,
      ...movie,
      id: existing.id,
      updatedAt: new Date(),
    };
    this.store.movies.set(id, updated);
    return { ...updated };
  }

  async delete(id: string): Promise<void> {
    this.store.movies.delete(id);
  }
}

class InMemoryPurchaseRepository implements IPurchaseRepository {
  constructor(private readonly store: InMemoryStore) {}

  async create(purchase: Partial<Purchase>): Promise<Purchase> {
    const record = this.createRecord(purchase);
    this.store.purchases.set(record.id, record);
    return this.toPurchase(record);
  }

  async createWithOutbox(
    purchase: Partial<Purchase>,
    outbox: CreateOutboxEventInput,
  ): Promise<Purchase> {
    const record = this.createRecord(purchase);
    this.store.purchases.set(record.id, record);

    const now = new Date();
    const outboxEvent: PaymentOutbox = {
      id: randomUUID(),
      purchaseId: record.id,
      eventType: outbox.eventType,
      payload: outbox.payload,
      status: PaymentOutboxStatus.PENDING,
      attempts: 0,
      nextAttemptAt: null,
      lastError: null,
      publishedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.outboxEvents.set(outboxEvent.id, outboxEvent);

    return this.toPurchase(record);
  }

  async findById(id: string): Promise<Purchase | null> {
    const record = this.store.purchases.get(id);
    return record ? this.toPurchase(record) : null;
  }

  async updateStatus(id: string, status: PurchaseStatus): Promise<Purchase> {
    const record = this.store.purchases.get(id);
    if (!record) {
      throw new Error(`Purchase ${id} not found`);
    }
    const updated: PurchaseRecord = {
      ...record,
      status,
      updatedAt: new Date(),
    };
    this.store.purchases.set(id, updated);
    return this.toPurchase(updated);
  }

  async findByUser(userId: string): Promise<Purchase[]> {
    return [...this.store.purchases.values()]
      .filter((purchase) => purchase.userId === userId)
      .sort(DEFAULT_PURCHASE_ORDER)
      .map((purchase) => this.toPurchase(purchase));
  }

  async findByUserPage(
    userId: string,
    params: PaginationParams,
    status?: PurchaseStatus,
  ): Promise<{ items: Purchase[]; total: number }> {
    const filtered = [...this.store.purchases.values()]
      .filter((purchase) => purchase.userId === userId)
      .filter((purchase) => (status ? purchase.status === status : true))
      .sort(DEFAULT_PURCHASE_ORDER);

    const pageItems = filtered
      .slice(params.skip, params.skip + params.limit)
      .map((purchase) => this.toPurchase(purchase));

    return {
      items: pageItems,
      total: filtered.length,
    };
  }

  async findByCorrelationId(correlationId: string): Promise<Purchase | null> {
    const record = [...this.store.purchases.values()].find(
      (purchase) => purchase.correlationId === correlationId,
    );
    return record ? this.toPurchase(record) : null;
  }

  async findOutboxEventsReadyToDispatch(
    batchSize: number,
    referenceDate: Date,
  ): Promise<PaymentOutbox[]> {
    const referenceTimestamp = referenceDate.getTime();

    return [...this.store.outboxEvents.values()]
      .filter((event) => event.status !== PaymentOutboxStatus.SENT)
      .filter(
        (event) =>
          !event.nextAttemptAt ||
          event.nextAttemptAt.getTime() <= referenceTimestamp,
      )
      .sort(
        (first, second) =>
          first.createdAt.getTime() - second.createdAt.getTime(),
      )
      .slice(0, batchSize)
      .map((event) => ({ ...event }));
  }

  async markOutboxEventAsSent(eventId: string): Promise<void> {
    const current = this.store.outboxEvents.get(eventId);
    if (!current) {
      return;
    }

    this.store.outboxEvents.set(eventId, {
      ...current,
      status: PaymentOutboxStatus.SENT,
      publishedAt: new Date(),
      updatedAt: new Date(),
    });
  }

  async markOutboxEventForRetry(
    eventId: string,
    status: PaymentOutboxStatus,
    attempts: number,
    nextAttemptAt: Date | null,
    lastError: string | null,
  ): Promise<void> {
    const current = this.store.outboxEvents.get(eventId);
    if (!current) {
      return;
    }

    this.store.outboxEvents.set(eventId, {
      ...current,
      status,
      attempts,
      nextAttemptAt,
      lastError,
      updatedAt: new Date(),
    });
  }

  private createRecord(purchase: Partial<Purchase>): PurchaseRecord {
    const now = new Date();
    return {
      id: purchase.id ?? randomUUID(),
      userId: purchase.userId ?? '',
      movieId: purchase.movieId ?? '',
      amount: purchase.amount ?? 0,
      status: purchase.status ?? PurchaseStatus.PENDING,
      provider: purchase.provider ?? 'mock',
      correlationId: purchase.correlationId ?? randomUUID(),
      stripePaymentIntentId: purchase.stripePaymentIntentId ?? null,
      failureReason: purchase.failureReason ?? null,
      createdAt: purchase.createdAt ?? now,
      updatedAt: purchase.updatedAt ?? now,
    };
  }

  private toPurchase(record: PurchaseRecord): Purchase {
    const user = this.store.users.get(record.userId) ?? null;
    const movie = this.store.movies.get(record.movieId) ?? null;

    return {
      ...record,
      user: user ? { ...user } : null,
      movie: movie ? { ...movie } : null,
    };
  }
}

class InMemoryPaymentAuditRepository implements IPaymentAuditRepository {
  constructor(private readonly store: InMemoryStore) {}

  async create(input: CreatePaymentAuditInput): Promise<PaymentAudit> {
    const created: PaymentAudit = {
      id: randomUUID(),
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
      createdAt: new Date(),
    };

    this.store.paymentAudits.set(created.id, created);
    return { ...created };
  }

  async findPage(
    params: PaginationParams,
  ): Promise<{ items: PaymentAudit[]; total: number }> {
    const ordered = [...this.store.paymentAudits.values()].sort(
      (first, second) => second.createdAt.getTime() - first.createdAt.getTime(),
    );
    const items = ordered
      .slice(params.skip, params.skip + params.limit)
      .map((item) => ({ ...item }));
    return { items, total: ordered.length };
  }
}
