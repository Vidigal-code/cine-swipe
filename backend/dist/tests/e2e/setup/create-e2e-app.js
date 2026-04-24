"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createE2eApp = createE2eApp;
exports.getCheckoutEvent = getCheckoutEvent;
exports.getDlqMessages = getDlqMessages;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const testing_1 = require("@nestjs/testing");
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const fs_1 = require("fs");
const path_1 = require("path");
const app_module_1 = require("../../../src/modules/app.module");
const movie_repository_1 = require("../../../src/domain/movie/interfaces/movie.repository");
const purchase_repository_1 = require("../../../src/domain/payment/interfaces/purchase.repository");
const payment_audit_repository_1 = require("../../../src/domain/payment/interfaces/payment-audit.repository");
const user_repository_1 = require("../../../src/domain/user/interfaces/user.repository");
const credit_repository_1 = require("../../../src/domain/credit/interfaces/credit.repository");
const user_entity_1 = require("../../../src/domain/user/entities/user.entity");
const admin_seed_service_1 = require("../../../src/infrastructure/database/admin-seed.service");
const jwt_guard_1 = require("../../../src/infrastructure/auth/guards/jwt.guard");
const prisma_service_1 = require("../../../src/infrastructure/database/prisma.service");
const rabbitmq_module_1 = require("../../../src/infrastructure/messaging/rabbitmq.module");
const stripe_webhook_service_1 = require("../../../src/infrastructure/payment/stripe-webhook.service");
const payment_outbox_dispatcher_1 = require("../../../src/presentation/workers/payment-outbox.dispatcher");
const payment_worker_1 = require("../../../src/presentation/workers/payment.worker");
const cors_config_1 = require("../../../src/shared/cors.config");
const payment_service_1 = require("../../../src/application/payment/payment.service");
const auth_cookie_config_1 = require("../../../src/shared/auth/auth-cookie.config");
const security_headers_config_1 = require("../../../src/shared/security-headers.config");
const fake_rabbit_client_1 = require("./fake-rabbit-client");
const in_memory_repositories_1 = require("./in-memory-repositories");
const credit_purchase_entity_1 = require("../../../src/domain/credit/entities/credit-purchase.entity");
const TEST_UPLOADS_DIRECTORY = (0, path_1.join)(process.cwd(), 'tests', 'e2e', '.tmp', 'uploads');
let E2eJwtAuthGuard = class E2eJwtAuthGuard {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const fromCookie = request.cookies?.[auth_cookie_config_1.ACCESS_TOKEN_COOKIE];
        const fromHeader = extractBearerToken(request.headers.authorization);
        const token = fromCookie ?? fromHeader;
        const tokenSource = fromCookie ? 'cookie' : fromHeader ? 'header' : 'none';
        if (!token) {
            throw new common_1.UnauthorizedException('Authentication required');
        }
        const payload = decodeJwtPayload(token);
        if (!payload || typeof payload.sub !== 'string') {
            throw new common_1.UnauthorizedException('Invalid or expired token');
        }
        if (tokenSource === 'cookie' &&
            (0, auth_cookie_config_1.csrfEnabled)(this.configService) &&
            !['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) {
            const csrfCookie = request.cookies?.[auth_cookie_config_1.CSRF_TOKEN_COOKIE];
            const csrfHeader = request.headers[auth_cookie_config_1.CSRF_HEADER_NAME];
            if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
                throw new common_1.UnauthorizedException('CSRF validation failed');
            }
        }
        request.user = {
            sub: payload.sub,
            email: typeof payload.email === 'string' ? payload.email : '',
            role: payload.role === user_entity_1.UserRole.ADMIN || payload.role === user_entity_1.UserRole.USER
                ? payload.role
                : user_entity_1.UserRole.USER,
            username: typeof payload.username === 'string' ? payload.username : '',
        };
        return true;
    }
};
E2eJwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], E2eJwtAuthGuard);
async function createE2eApp() {
    applyE2eEnvironment();
    (0, fs_1.mkdirSync)(TEST_UPLOADS_DIRECTORY, { recursive: true });
    const repositories = (0, in_memory_repositories_1.createInMemoryRepositories)();
    const paymentQueueClient = new fake_rabbit_client_1.FakeRabbitClient();
    const paymentDlqClient = new fake_rabbit_client_1.FakeRabbitClient();
    const creditRepositoryStub = createCreditRepositoryStub();
    const stripeWebhookMock = {
        constructEvent: jest.fn(),
    };
    const moduleRef = await testing_1.Test.createTestingModule({
        imports: [app_module_1.AppModule],
    })
        .overrideProvider(user_repository_1.USER_REPOSITORY)
        .useValue(repositories.userRepository)
        .overrideProvider(movie_repository_1.MOVIE_REPOSITORY)
        .useValue(repositories.movieRepository)
        .overrideProvider(purchase_repository_1.PURCHASE_REPOSITORY)
        .useValue(repositories.purchaseRepository)
        .overrideProvider(payment_audit_repository_1.PAYMENT_AUDIT_REPOSITORY)
        .useValue(repositories.paymentAuditRepository)
        .overrideProvider(credit_repository_1.CREDIT_REPOSITORY)
        .useValue(creditRepositoryStub)
        .overrideProvider(rabbitmq_module_1.PAYMENT_QUEUE_CLIENT)
        .useValue(paymentQueueClient)
        .overrideProvider(rabbitmq_module_1.PAYMENT_DLQ_CLIENT)
        .useValue(paymentDlqClient)
        .overrideProvider(stripe_webhook_service_1.StripeWebhookService)
        .useValue(stripeWebhookMock)
        .overrideProvider(admin_seed_service_1.AdminSeedService)
        .useValue({ onModuleInit: async () => undefined })
        .overrideProvider(prisma_service_1.PrismaService)
        .useValue(createPrismaStub())
        .overrideProvider(jwt_guard_1.JwtAuthGuard)
        .useClass(E2eJwtAuthGuard)
        .compile();
    const app = moduleRef.createNestApplication({
        rawBody: true,
    });
    const configService = app.get(config_1.ConfigService);
    app.use((0, cookie_parser_1.default)());
    app.use((0, helmet_1.default)((0, security_headers_config_1.buildHelmetOptions)(configService)));
    app.enableCors((0, cors_config_1.buildCorsOptions)(configService));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    await app.init();
    const paymentOutboxDispatcher = app.get(payment_outbox_dispatcher_1.PaymentOutboxDispatcher);
    paymentOutboxDispatcher.onModuleDestroy();
    const paymentWorker = app.get(payment_worker_1.PaymentWorker);
    return {
        app,
        repositories,
        paymentQueueClient,
        paymentDlqClient,
        stripeWebhookMock,
        paymentOutboxDispatcher,
        paymentWorker,
        resetState: () => {
            repositories.store.users.clear();
            repositories.store.movies.clear();
            repositories.store.purchases.clear();
            repositories.store.outboxEvents.clear();
            repositories.store.paymentAudits.clear();
            paymentQueueClient.clear();
            paymentDlqClient.clear();
            stripeWebhookMock.constructEvent.mockReset();
        },
        close: async () => {
            await app.close();
            (0, fs_1.rmSync)(TEST_UPLOADS_DIRECTORY, { recursive: true, force: true });
        },
    };
}
function getCheckoutEvent(queueClient) {
    const message = queueClient.popFirstMessage(payment_service_1.CHECKOUT_REQUESTED_EVENT);
    if (!message) {
        throw new Error('No checkout event was published');
    }
    return message.payload;
}
function getDlqMessages(queueClient) {
    return queueClient.getMessages(payment_service_1.CHECKOUT_FAILED_EVENT);
}
function applyE2eEnvironment() {
    process.env.APP_ENV = 'test';
    process.env.APP_LOGGER_ENABLED = 'false';
    process.env.JWT_SECRET = 'e2e-jwt-secret';
    process.env.AUTH_JWE_SECRET = 'e2e-jwe-secret';
    process.env.AUTH_PROVIDER = 'local';
    process.env.PAYMENT_PROVIDER = 'mock';
    process.env.STRIPE_SECRET_KEY = 'sk_test_1234567890';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_1234567890';
    process.env.CSRF_ENABLED = 'true';
    process.env.AUTH_COOKIE_SECURE = 'false';
    process.env.AUTH_COOKIE_SAMESITE = 'lax';
    process.env.CORS_ALLOWED_ORIGINS = 'http://localhost:3000';
    process.env.NEXT_PUBLIC_FRONTEND_URL = 'http://localhost:3000';
    process.env.BACKEND_BASE_URL = 'http://localhost:3001';
    process.env.CSP_ENABLED = 'false';
    process.env.UPLOADS_DIR = TEST_UPLOADS_DIRECTORY;
    process.env.UPLOAD_ALLOWED_MIME_TYPES = 'image/jpeg,image/png,image/webp';
    process.env.UPLOAD_MAX_FILE_SIZE_MB = '1';
    process.env.ADMIN_EMAIL = 'admin@system.local';
    process.env.ADMIN_PASSWORD = 'Admin@12345';
    process.env.ADMIN_USERNAME = 'vidigal';
    process.env.RATE_LIMIT_PERMITS = '10000';
}
function createPrismaStub() {
    return {
        $connect: async () => undefined,
        $disconnect: async () => undefined,
        user: {
            upsert: async () => undefined,
        },
    };
}
function createCreditRepositoryStub() {
    return {
        findCreditPlanById: async () => null,
        listCreditPlans: async () => ({ items: [], total: 0 }),
        createCreditPlan: async () => {
            throw new Error('not implemented in e2e stub');
        },
        updateCreditPlan: async () => {
            throw new Error('not implemented in e2e stub');
        },
        deleteCreditPlan: async () => undefined,
        getCreditSystemConfig: async () => ({
            id: 1,
            registrationBonusCredits: 250,
            referralEnabled: true,
            refereeRegistrationBonusCredits: 50,
            referrerFirstPurchaseBonusCredits: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
        updateCreditSystemConfig: async () => ({
            id: 1,
            registrationBonusCredits: 250,
            referralEnabled: true,
            refereeRegistrationBonusCredits: 50,
            referrerFirstPurchaseBonusCredits: 100,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
        createCreditPurchaseWithOutbox: async () => ({
            id: 'stub',
            userId: 'stub',
            creditPlanId: 'stub',
            creditsAmount: 0,
            amountBrl: 0,
            status: credit_purchase_entity_1.CreditPurchaseStatus.PENDING,
            provider: 'mock',
            correlationId: 'stub',
            stripePaymentIntentId: null,
            failureReason: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
        findCreditPurchaseById: async () => null,
        findCreditPurchaseByCorrelationId: async () => null,
        updateCreditPurchaseStatus: async () => ({
            id: 'stub',
            userId: 'stub',
            creditPlanId: 'stub',
            creditsAmount: 0,
            amountBrl: 0,
            status: credit_purchase_entity_1.CreditPurchaseStatus.FAILED,
            provider: 'mock',
            correlationId: 'stub',
            stripePaymentIntentId: null,
            failureReason: null,
            createdAt: new Date(),
            updatedAt: new Date(),
        }),
        listUserCreditTransactions: async () => ({ items: [], total: 0 }),
        listUserCreditPurchases: async () => ({ items: [], total: 0 }),
        adjustUserCredits: async () => ({
            id: 'stub',
            userId: 'stub',
            type: 'REGISTRATION_BONUS',
            amount: 250,
            balanceBefore: 0,
            balanceAfter: 250,
            description: null,
            correlationId: null,
            metadata: null,
            createdAt: new Date(),
        }),
        getUserCreditsBalance: async () => 0,
        markFirstApprovedCreditPurchaseDone: async () => false,
        findOutboxEventsReadyToDispatch: async () => [],
        markOutboxEventAsSent: async () => undefined,
        markOutboxEventForRetry: async (_eventId, _status, _attempts, _nextAttemptAt, _lastError) => undefined,
        findReferralRewardLog: async () => null,
        createReferralRewardLog: async () => ({
            id: 'stub',
            referrerUserId: 'stub',
            refereeUserId: 'stub',
            rewardType: 'REFEREE_REGISTRATION',
            creditsGranted: 0,
            correlationId: null,
            createdAt: new Date(),
        }),
    };
}
function extractBearerToken(authorization) {
    if (!authorization) {
        return undefined;
    }
    const [prefix, token] = authorization.split(' ');
    return prefix === 'Bearer' ? token : undefined;
}
function decodeJwtPayload(token) {
    const parts = token.split('.');
    if (parts.length < 2) {
        return null;
    }
    try {
        const decoded = Buffer.from(parts[1], 'base64url').toString('utf8');
        return JSON.parse(decoded);
    }
    catch {
        return null;
    }
}
//# sourceMappingURL=create-e2e-app.js.map