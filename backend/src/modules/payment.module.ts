import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PaymentController } from '../presentation/controllers/payment.controller';
import { PaymentAuditController } from '../presentation/controllers/payment-audit.controller';
import { StripeWebhookController } from '../presentation/controllers/stripe-webhook.controller';
import { PaymentWorker } from '../presentation/workers/payment.worker';
import { PaymentService } from '../application/payment/payment.service';
import { PrismaPurchaseRepository } from '../infrastructure/database/repositories/purchase.repository';
import { PURCHASE_REPOSITORY } from '../domain/payment/interfaces/purchase.repository';
import { PaymentAuditService } from '../application/payment/payment-audit.service';
import { PrismaPaymentAuditRepository } from '../infrastructure/database/repositories/payment-audit.repository';
import { PAYMENT_AUDIT_REPOSITORY } from '../domain/payment/interfaces/payment-audit.repository';

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

@Module({
  imports: [
    DatabaseModule,
    RabbitMQModule,
    MovieModule,
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
    {
      provide: PURCHASE_REPOSITORY,
      useClass: PrismaPurchaseRepository,
    },
    {
      provide: PAYMENT_AUDIT_REPOSITORY,
      useClass: PrismaPaymentAuditRepository,
    },
  ],
})
export class PaymentModule {}
