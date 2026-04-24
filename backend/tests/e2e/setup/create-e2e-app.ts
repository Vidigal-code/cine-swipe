import {
  Injectable,
  type CanActivate,
  type ExecutionContext,
  UnauthorizedException,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import type Stripe from 'stripe';
import { AppModule } from '../../../src/modules/app.module';
import { MOVIE_REPOSITORY } from '../../../src/domain/movie/interfaces/movie.repository';
import { PURCHASE_REPOSITORY } from '../../../src/domain/payment/interfaces/purchase.repository';
import { PAYMENT_AUDIT_REPOSITORY } from '../../../src/domain/payment/interfaces/payment-audit.repository';
import { USER_REPOSITORY } from '../../../src/domain/user/interfaces/user.repository';
import { CREDIT_REPOSITORY } from '../../../src/domain/credit/interfaces/credit.repository';
import { UserRole } from '../../../src/domain/user/entities/user.entity';
import { AdminSeedService } from '../../../src/infrastructure/database/admin-seed.service';
import { JwtAuthGuard } from '../../../src/infrastructure/auth/guards/jwt.guard';
import { PrismaService } from '../../../src/infrastructure/database/prisma.service';
import {
  PAYMENT_DLQ_CLIENT,
  PAYMENT_QUEUE_CLIENT,
} from '../../../src/infrastructure/messaging/rabbitmq.module';
import { StripeWebhookService } from '../../../src/infrastructure/payment/stripe-webhook.service';
import { PaymentOutboxDispatcher } from '../../../src/presentation/workers/payment-outbox.dispatcher';
import { PaymentWorker } from '../../../src/presentation/workers/payment.worker';
import { buildCorsOptions } from '../../../src/shared/cors.config';
import {
  CHECKOUT_FAILED_EVENT,
  CHECKOUT_REQUESTED_EVENT,
} from '../../../src/application/payment/payment.service';
import {
  ACCESS_TOKEN_COOKIE,
  csrfEnabled,
  CSRF_HEADER_NAME,
  CSRF_TOKEN_COOKIE,
} from '../../../src/shared/auth/auth-cookie.config';
import { buildHelmetOptions } from '../../../src/shared/security-headers.config';
import { FakeRabbitClient } from './fake-rabbit-client';
import { createInMemoryRepositories } from './in-memory-repositories';
import { CreditPurchaseStatus } from '../../../src/domain/credit/entities/credit-purchase.entity';
import { CreditPurchaseOutboxStatus } from '../../../src/domain/credit/entities/credit-purchase-outbox.entity';

const TEST_UPLOADS_DIRECTORY = join(
  process.cwd(),
  'tests',
  'e2e',
  '.tmp',
  'uploads',
);

type StripeWebhookMock = {
  constructEvent: jest.Mock<Stripe.Event, [Buffer, string]>;
};

export interface E2eAppContext {
  app: NestExpressApplication;
  repositories: ReturnType<typeof createInMemoryRepositories>;
  paymentQueueClient: FakeRabbitClient;
  paymentDlqClient: FakeRabbitClient;
  stripeWebhookMock: StripeWebhookMock;
  paymentOutboxDispatcher: PaymentOutboxDispatcher;
  paymentWorker: PaymentWorker;
  resetState: () => void;
  close: () => Promise<void>;
}

@Injectable()
class E2eJwtAuthGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      method: string;
      headers: Record<string, string | undefined>;
      cookies?: Record<string, string>;
      user?: { sub: string; email: string; role: UserRole; username?: string };
    }>();

    const fromCookie = request.cookies?.[ACCESS_TOKEN_COOKIE];
    const fromHeader = extractBearerToken(request.headers.authorization);
    const token = fromCookie ?? fromHeader;
    const tokenSource = fromCookie ? 'cookie' : fromHeader ? 'header' : 'none';

    if (!token) {
      throw new UnauthorizedException('Authentication required');
    }

    const payload = decodeJwtPayload(token);
    if (!payload || typeof payload.sub !== 'string') {
      throw new UnauthorizedException('Invalid or expired token');
    }

    if (
      tokenSource === 'cookie' &&
      csrfEnabled(this.configService) &&
      !['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())
    ) {
      const csrfCookie = request.cookies?.[CSRF_TOKEN_COOKIE];
      const csrfHeader = request.headers[CSRF_HEADER_NAME];
      if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
        throw new UnauthorizedException('CSRF validation failed');
      }
    }

    request.user = {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : '',
      role:
        payload.role === UserRole.ADMIN || payload.role === UserRole.USER
          ? payload.role
          : UserRole.USER,
      username: typeof payload.username === 'string' ? payload.username : '',
    };
    return true;
  }
}

export async function createE2eApp(): Promise<E2eAppContext> {
  applyE2eEnvironment();
  mkdirSync(TEST_UPLOADS_DIRECTORY, { recursive: true });

  const repositories = createInMemoryRepositories();
  const paymentQueueClient = new FakeRabbitClient();
  const paymentDlqClient = new FakeRabbitClient();
  const creditRepositoryStub = createCreditRepositoryStub();
  const stripeWebhookMock: StripeWebhookMock = {
    constructEvent: jest.fn(),
  };

  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideProvider(USER_REPOSITORY)
    .useValue(repositories.userRepository)
    .overrideProvider(MOVIE_REPOSITORY)
    .useValue(repositories.movieRepository)
    .overrideProvider(PURCHASE_REPOSITORY)
    .useValue(repositories.purchaseRepository)
    .overrideProvider(PAYMENT_AUDIT_REPOSITORY)
    .useValue(repositories.paymentAuditRepository)
    .overrideProvider(CREDIT_REPOSITORY)
    .useValue(creditRepositoryStub)
    .overrideProvider(PAYMENT_QUEUE_CLIENT)
    .useValue(paymentQueueClient)
    .overrideProvider(PAYMENT_DLQ_CLIENT)
    .useValue(paymentDlqClient)
    .overrideProvider(StripeWebhookService)
    .useValue(stripeWebhookMock)
    .overrideProvider(AdminSeedService)
    .useValue({ onModuleInit: async () => undefined })
    .overrideProvider(PrismaService)
    .useValue(createPrismaStub())
    .overrideProvider(JwtAuthGuard)
    .useClass(E2eJwtAuthGuard)
    .compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({
    rawBody: true,
  });
  const configService = app.get(ConfigService);

  app.use(cookieParser());
  app.use(helmet(buildHelmetOptions(configService)));
  app.enableCors(buildCorsOptions(configService));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  await app.init();

  const paymentOutboxDispatcher = app.get(PaymentOutboxDispatcher);
  paymentOutboxDispatcher.onModuleDestroy();
  const paymentWorker = app.get(PaymentWorker);

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
      rmSync(TEST_UPLOADS_DIRECTORY, { recursive: true, force: true });
    },
  };
}

export function getCheckoutEvent(queueClient: FakeRabbitClient): {
  purchaseId: string;
  amount: number;
  provider: string;
  correlationId: string;
  retryCount: number;
} {
  const message = queueClient.popFirstMessage(CHECKOUT_REQUESTED_EVENT);
  if (!message) {
    throw new Error('No checkout event was published');
  }
  return message.payload as {
    purchaseId: string;
    amount: number;
    provider: string;
    correlationId: string;
    retryCount: number;
  };
}

export function getDlqMessages(queueClient: FakeRabbitClient) {
  return queueClient.getMessages(CHECKOUT_FAILED_EVENT);
}

function applyE2eEnvironment(): void {
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
      status: CreditPurchaseStatus.PENDING,
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
      status: CreditPurchaseStatus.FAILED,
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
    markOutboxEventForRetry: async (
      _eventId: string,
      _status: CreditPurchaseOutboxStatus,
      _attempts: number,
      _nextAttemptAt: Date | null,
      _lastError: string | null,
    ) => undefined,
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

function extractBearerToken(
  authorization: string | undefined,
): string | undefined {
  if (!authorization) {
    return undefined;
  }
  const [prefix, token] = authorization.split(' ');
  return prefix === 'Bearer' ? token : undefined;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  if (parts.length < 2) {
    return null;
  }

  try {
    const decoded = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}
