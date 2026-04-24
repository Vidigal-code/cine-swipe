import { Movie } from '../../../src/domain/movie/entities/movie.entity';
import type { IMovieRepository } from '../../../src/domain/movie/interfaces/movie.repository';
import { CreatePaymentAuditInput, PaymentAudit } from '../../../src/domain/payment/entities/payment-audit.entity';
import { PaymentOutbox, PaymentOutboxStatus, type CreateOutboxEventInput } from '../../../src/domain/payment/entities/payment-outbox.entity';
import { Purchase, PurchaseStatus } from '../../../src/domain/payment/entities/purchase.entity';
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
export declare function createInMemoryRepositories(): {
    store: InMemoryStore;
    userRepository: InMemoryUserRepository;
    movieRepository: InMemoryMovieRepository;
    purchaseRepository: InMemoryPurchaseRepository;
    paymentAuditRepository: InMemoryPaymentAuditRepository;
};
declare class InMemoryUserRepository implements IUserRepository {
    private readonly store;
    constructor(store: InMemoryStore);
    create(user: Partial<User>): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findByUsername(username: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    findByFirebaseUid(firebaseUid: string): Promise<User | null>;
    findByReferralCode(referralCode: string): Promise<User | null>;
    findPage(params: PaginationParams): Promise<{
        items: User[];
        total: number;
    }>;
    countByRole(role: UserRole): Promise<number>;
    update(id: string, user: Partial<User>): Promise<User>;
    delete(id: string): Promise<void>;
    private resolveUsername;
}
declare class InMemoryMovieRepository implements IMovieRepository {
    private readonly store;
    constructor(store: InMemoryStore);
    create(movie: Partial<Movie>): Promise<Movie>;
    findAll(): Promise<Movie[]>;
    findPage(params: PaginationParams): Promise<{
        items: Movie[];
        total: number;
    }>;
    findById(id: string): Promise<Movie | null>;
    update(id: string, movie: Partial<Movie>): Promise<Movie>;
    delete(id: string): Promise<void>;
}
declare class InMemoryPurchaseRepository implements IPurchaseRepository {
    private readonly store;
    constructor(store: InMemoryStore);
    create(purchase: Partial<Purchase>): Promise<Purchase>;
    createWithOutbox(purchase: Partial<Purchase>, outbox: CreateOutboxEventInput): Promise<Purchase>;
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
    private createRecord;
    private toPurchase;
}
declare class InMemoryPaymentAuditRepository implements IPaymentAuditRepository {
    private readonly store;
    constructor(store: InMemoryStore);
    create(input: CreatePaymentAuditInput): Promise<PaymentAudit>;
    findPage(params: PaginationParams): Promise<{
        items: PaymentAudit[];
        total: number;
    }>;
}
export {};
