import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

import { PaymentController } from '../presentation/controllers/payment.controller';
import { PaymentAuditController } from '../presentation/controllers/payment-audit.controller';
import { StripeWebhookController } from '../presentation/controllers/stripe-webhook.controller';
import { PaymentWorker } from '../presentation/workers/payment.worker';
import { PaymentService } from '../application/payment/payment.service';
import { PrismaPurchaseRepository } from '../infrastructure/database/repositories/purchase.repository';
import { PURCHASE_REPOSITORY } from '../domain/payment/interfaces/purchase.repository';
import type { IPurchaseRepository } from '../domain/payment/interfaces/purchase.repository';
import { PaymentAuditService } from '../application/payment/payment-audit.service';
import { PrismaPaymentAuditRepository } from '../infrastructure/database/repositories/payment-audit.repository';
import { PAYMENT_AUDIT_REPOSITORY } from '../domain/payment/interfaces/payment-audit.repository';
import type { IPaymentAuditRepository } from '../domain/payment/interfaces/payment-audit.repository';

import { RabbitMQModule } from '../infrastructure/messaging/rabbitmq.module';
import { MovieModule } from './movie.module';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { StripeGateway } from 'src/infrastructure/payment/stripe.gateway';
import { PaymentGatewayFactory } from 'src/infrastructure/payment/payment-gateway.factory';
import { MockPaymentGateway } from 'src/infrastructure/payment/mock-payment.gateway';
import { StripeWebhookService } from 'src/infrastructure/payment/stripe-webhook.service';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt.guard';
import { SharedModule } from '../shared/shared.module';
import { PaymentOutboxDispatcher } from '../presentation/workers/payment-outbox.dispatcher';
import { ResponseModule } from '../shared/http-response/response.module';
import { FirebasePurchaseRepository } from '../infrastructure/firebase/repositories/firebase-purchase.repository';
import { FirebasePaymentAuditRepository } from '../infrastructure/firebase/repositories/firebase-payment-audit.repository';
import { pickDatabaseRepository } from '../infrastructure/database/repository-provider.factory';
import { WEBHOOK_EVENT_REPOSITORY } from '../domain/payment/interfaces/webhook-event.repository';
import type { IWebhookEventRepository } from '../domain/payment/interfaces/webhook-event.repository';
import { PrismaWebhookEventRepository } from '../infrastructure/database/repositories/webhook-event.repository';
import { FirebaseWebhookEventRepository } from '../infrastructure/firebase/repositories/firebase-webhook-event.repository';
import { CreditModule } from './credit.module';

@Module({
  imports: [
    DatabaseModule,
    RabbitMQModule,
    MovieModule,
    CreditModule,
    SharedModule,
    ResponseModule,
    JwtModule,
  ],
  controllers: [
    PaymentController,
    PaymentAuditController,
    StripeWebhookController,
    PaymentWorker,
  ],
  providers: [
    PaymentService,
    PaymentAuditService,
    PaymentOutboxDispatcher,
    JwtAuthGuard,
    StripeGateway,
    StripeWebhookService,
    MockPaymentGateway,
    PaymentGatewayFactory,
    PrismaPurchaseRepository,
    FirebasePurchaseRepository,
    PrismaPaymentAuditRepository,
    FirebasePaymentAuditRepository,
    PrismaWebhookEventRepository,
    FirebaseWebhookEventRepository,
    {
      provide: PURCHASE_REPOSITORY,
      inject: [
        ConfigService,
        PrismaPurchaseRepository,
        FirebasePurchaseRepository,
      ],
      useFactory: (
        configService: ConfigService,
        prismaRepository: PrismaPurchaseRepository,
        firebaseRepository: FirebasePurchaseRepository,
      ): IPurchaseRepository =>
        pickDatabaseRepository<IPurchaseRepository>(configService, {
          postgres: prismaRepository,
          firebase: firebaseRepository,
        }),
    },
    {
      provide: PAYMENT_AUDIT_REPOSITORY,
      inject: [
        ConfigService,
        PrismaPaymentAuditRepository,
        FirebasePaymentAuditRepository,
      ],
      useFactory: (
        configService: ConfigService,
        prismaRepository: PrismaPaymentAuditRepository,
        firebaseRepository: FirebasePaymentAuditRepository,
      ): IPaymentAuditRepository =>
        pickDatabaseRepository<IPaymentAuditRepository>(configService, {
          postgres: prismaRepository,
          firebase: firebaseRepository,
        }),
    },
    {
      provide: WEBHOOK_EVENT_REPOSITORY,
      inject: [
        ConfigService,
        PrismaWebhookEventRepository,
        FirebaseWebhookEventRepository,
      ],
      useFactory: (
        configService: ConfigService,
        prismaRepository: PrismaWebhookEventRepository,
        firebaseRepository: FirebaseWebhookEventRepository,
      ): IWebhookEventRepository =>
        pickDatabaseRepository<IWebhookEventRepository>(configService, {
          postgres: prismaRepository,
          firebase: firebaseRepository,
        }),
    },
  ],
})
export class PaymentModule {}
