import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { RabbitMQModule } from '../infrastructure/messaging/rabbitmq.module';
import { SharedModule } from '../shared/shared.module';
import { ResponseModule } from '../shared/http-response/response.module';
import { CreditController } from '../presentation/controllers/credit.controller';
import { AdminCreditController } from '../presentation/controllers/admin-credit.controller';
import { CreditPaymentWorker } from '../presentation/workers/credit-payment.worker';
import { CreditOutboxDispatcher } from '../presentation/workers/credit-outbox.dispatcher';
import { CreditService } from '../application/credit/credit.service';
import { CREDIT_REPOSITORY } from '../domain/credit/interfaces/credit.repository';
import { PrismaCreditRepository } from '../infrastructure/database/repositories/credit.repository';
import { USER_REPOSITORY } from '../domain/user/interfaces/user.repository';
import { PrismaUserRepository } from '../infrastructure/database/repositories/user.repository';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt.guard';
import { PaymentGatewayFactory } from '../infrastructure/payment/payment-gateway.factory';
import { StripeGateway } from '../infrastructure/payment/stripe.gateway';
import { MockPaymentGateway } from '../infrastructure/payment/mock-payment.gateway';

@Module({
  imports: [
    DatabaseModule,
    RabbitMQModule,
    SharedModule,
    ResponseModule,
    JwtModule,
  ],
  controllers: [CreditController, AdminCreditController, CreditPaymentWorker],
  providers: [
    CreditService,
    CreditOutboxDispatcher,
    JwtAuthGuard,
    PaymentGatewayFactory,
    StripeGateway,
    MockPaymentGateway,
    {
      provide: CREDIT_REPOSITORY,
      useClass: PrismaCreditRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: PrismaUserRepository,
    },
  ],
  exports: [CreditService, CREDIT_REPOSITORY],
})
export class CreditModule {}
