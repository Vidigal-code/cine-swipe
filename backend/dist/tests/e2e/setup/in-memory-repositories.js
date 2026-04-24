"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInMemoryRepositories = createInMemoryRepositories;
const crypto_1 = require("crypto");
const payment_outbox_entity_1 = require("../../../src/domain/payment/entities/payment-outbox.entity");
const purchase_entity_1 = require("../../../src/domain/payment/entities/purchase.entity");
const user_entity_1 = require("../../../src/domain/user/entities/user.entity");
const DEFAULT_MOVIE_ORDER = (first, second) => second.createdAt.getTime() - first.createdAt.getTime();
const DEFAULT_PURCHASE_ORDER = (first, second) => second.createdAt.getTime() - first.createdAt.getTime();
function createInMemoryRepositories() {
    const store = {
        users: new Map(),
        movies: new Map(),
        purchases: new Map(),
        outboxEvents: new Map(),
        paymentAudits: new Map(),
    };
    return {
        store,
        userRepository: new InMemoryUserRepository(store),
        movieRepository: new InMemoryMovieRepository(store),
        purchaseRepository: new InMemoryPurchaseRepository(store),
        paymentAuditRepository: new InMemoryPaymentAuditRepository(store),
    };
}
class InMemoryUserRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    async create(user) {
        const now = new Date();
        const created = {
            id: user.id ?? (0, crypto_1.randomUUID)(),
            username: user.username ?? this.resolveUsername(user.email),
            email: user.email ?? `${(0, crypto_1.randomUUID)()}@mail.local`,
            passwordHash: user.passwordHash ?? null,
            firebaseUid: user.firebaseUid ?? null,
            role: user.role ?? user_entity_1.UserRole.USER,
            creditsBalance: user.creditsBalance ?? 0,
            avatarUrl: user.avatarUrl ?? null,
            referralCode: user.referralCode ?? `ref_${(0, crypto_1.randomUUID)().slice(0, 8)}`,
            referredByUserId: user.referredByUserId ?? null,
            firstApprovedCreditPurchaseDone: user.firstApprovedCreditPurchaseDone ?? false,
            referralSignupBonusGranted: user.referralSignupBonusGranted ?? false,
            createdAt: user.createdAt ?? now,
            updatedAt: user.updatedAt ?? now,
        };
        this.store.users.set(created.id, created);
        return { ...created };
    }
    async findByEmail(email) {
        const found = [...this.store.users.values()].find((user) => user.email === email);
        return found ? { ...found } : null;
    }
    async findByUsername(username) {
        const found = [...this.store.users.values()].find((user) => user.username === username);
        return found ? { ...found } : null;
    }
    async findById(id) {
        const found = this.store.users.get(id);
        return found ? { ...found } : null;
    }
    async findByFirebaseUid(firebaseUid) {
        const found = [...this.store.users.values()].find((user) => user.firebaseUid === firebaseUid);
        return found ? { ...found } : null;
    }
    async findByReferralCode(referralCode) {
        const found = [...this.store.users.values()].find((user) => user.referralCode === referralCode);
        return found ? { ...found } : null;
    }
    async findPage(params) {
        const ordered = [...this.store.users.values()].sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
        const items = ordered
            .slice(params.skip, params.skip + params.limit)
            .map((user) => ({ ...user }));
        return {
            items,
            total: ordered.length,
        };
    }
    async countByRole(role) {
        return [...this.store.users.values()].filter((user) => user.role === role).length;
    }
    async update(id, user) {
        const existing = this.store.users.get(id);
        if (!existing) {
            throw new Error(`User ${id} not found`);
        }
        const updated = {
            ...existing,
            ...user,
            id: existing.id,
            updatedAt: new Date(),
        };
        this.store.users.set(id, updated);
        return { ...updated };
    }
    async delete(id) {
        this.store.users.delete(id);
    }
    resolveUsername(email) {
        if (!email) {
            return `user_${(0, crypto_1.randomUUID)().slice(0, 8)}`;
        }
        return email.split('@')[0].slice(0, 40);
    }
}
class InMemoryMovieRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    async create(movie) {
        const now = new Date();
        const created = {
            id: movie.id ?? (0, crypto_1.randomUUID)(),
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
    async findAll() {
        return [...this.store.movies.values()]
            .sort(DEFAULT_MOVIE_ORDER)
            .map((movie) => ({ ...movie }));
    }
    async findPage(params) {
        const all = [...this.store.movies.values()].sort(DEFAULT_MOVIE_ORDER);
        const items = all
            .slice(params.skip, params.skip + params.limit)
            .map((movie) => ({ ...movie }));
        return { items, total: all.length };
    }
    async findById(id) {
        const movie = this.store.movies.get(id);
        return movie ? { ...movie } : null;
    }
    async update(id, movie) {
        const existing = this.store.movies.get(id);
        if (!existing) {
            throw new Error(`Movie ${id} not found`);
        }
        const updated = {
            ...existing,
            ...movie,
            id: existing.id,
            updatedAt: new Date(),
        };
        this.store.movies.set(id, updated);
        return { ...updated };
    }
    async delete(id) {
        this.store.movies.delete(id);
    }
}
class InMemoryPurchaseRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    async create(purchase) {
        const record = this.createRecord(purchase);
        this.store.purchases.set(record.id, record);
        return this.toPurchase(record);
    }
    async createWithOutbox(purchase, outbox) {
        const record = this.createRecord(purchase);
        this.store.purchases.set(record.id, record);
        const now = new Date();
        const outboxEvent = {
            id: (0, crypto_1.randomUUID)(),
            purchaseId: record.id,
            eventType: outbox.eventType,
            payload: outbox.payload,
            status: payment_outbox_entity_1.PaymentOutboxStatus.PENDING,
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
    async findById(id) {
        const record = this.store.purchases.get(id);
        return record ? this.toPurchase(record) : null;
    }
    async updateStatus(id, status) {
        const record = this.store.purchases.get(id);
        if (!record) {
            throw new Error(`Purchase ${id} not found`);
        }
        const updated = {
            ...record,
            status,
            updatedAt: new Date(),
        };
        this.store.purchases.set(id, updated);
        return this.toPurchase(updated);
    }
    async findByUser(userId) {
        return [...this.store.purchases.values()]
            .filter((purchase) => purchase.userId === userId)
            .sort(DEFAULT_PURCHASE_ORDER)
            .map((purchase) => this.toPurchase(purchase));
    }
    async findByUserPage(userId, params, status) {
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
    async findByCorrelationId(correlationId) {
        const record = [...this.store.purchases.values()].find((purchase) => purchase.correlationId === correlationId);
        return record ? this.toPurchase(record) : null;
    }
    async findOutboxEventsReadyToDispatch(batchSize, referenceDate) {
        const referenceTimestamp = referenceDate.getTime();
        return [...this.store.outboxEvents.values()]
            .filter((event) => event.status !== payment_outbox_entity_1.PaymentOutboxStatus.SENT)
            .filter((event) => !event.nextAttemptAt || event.nextAttemptAt.getTime() <= referenceTimestamp)
            .sort((first, second) => first.createdAt.getTime() - second.createdAt.getTime())
            .slice(0, batchSize)
            .map((event) => ({ ...event }));
    }
    async markOutboxEventAsSent(eventId) {
        const current = this.store.outboxEvents.get(eventId);
        if (!current) {
            return;
        }
        this.store.outboxEvents.set(eventId, {
            ...current,
            status: payment_outbox_entity_1.PaymentOutboxStatus.SENT,
            publishedAt: new Date(),
            updatedAt: new Date(),
        });
    }
    async markOutboxEventForRetry(eventId, status, attempts, nextAttemptAt, lastError) {
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
    createRecord(purchase) {
        const now = new Date();
        return {
            id: purchase.id ?? (0, crypto_1.randomUUID)(),
            userId: purchase.userId ?? '',
            movieId: purchase.movieId ?? '',
            amount: purchase.amount ?? 0,
            status: purchase.status ?? purchase_entity_1.PurchaseStatus.PENDING,
            provider: purchase.provider ?? 'mock',
            correlationId: purchase.correlationId ?? (0, crypto_1.randomUUID)(),
            stripePaymentIntentId: purchase.stripePaymentIntentId ?? null,
            failureReason: purchase.failureReason ?? null,
            createdAt: purchase.createdAt ?? now,
            updatedAt: purchase.updatedAt ?? now,
        };
    }
    toPurchase(record) {
        const user = this.store.users.get(record.userId) ?? null;
        const movie = this.store.movies.get(record.movieId) ?? null;
        return {
            ...record,
            user: user ? { ...user } : null,
            movie: movie ? { ...movie } : null,
        };
    }
}
class InMemoryPaymentAuditRepository {
    store;
    constructor(store) {
        this.store = store;
    }
    async create(input) {
        const created = {
            id: (0, crypto_1.randomUUID)(),
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
    async findPage(params) {
        const ordered = [...this.store.paymentAudits.values()].sort((first, second) => second.createdAt.getTime() - first.createdAt.getTime());
        const items = ordered
            .slice(params.skip, params.skip + params.limit)
            .map((item) => ({ ...item }));
        return { items, total: ordered.length };
    }
}
//# sourceMappingURL=in-memory-repositories.js.map