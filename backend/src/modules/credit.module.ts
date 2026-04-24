import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
import type { ICreditRepository } from '../domain/credit/interfaces/credit.repository';
import { PrismaCreditRepository } from '../infrastructure/database/repositories/credit.repository';
import { USER_REPOSITORY } from '../domain/user/interfaces/user.repository';
import type { IUserRepository } from '../domain/user/interfaces/user.repository';
import { PrismaUserRepository } from '../infrastructure/database/repositories/user.repository';
import { JwtAuthGuard } from '../infrastructure/auth/guards/jwt.guard';
import { PaymentGatewayFactory } from '../infrastructure/payment/payment-gateway.factory';
import { StripeGateway } from '../infrastructure/payment/stripe.gateway';
import { MockPaymentGateway } from '../infrastructure/payment/mock-payment.gateway';
import { FirebaseCreditRepository } from '../infrastructure/firebase/repositories/firebase-credit.repository';
import { FirebaseUserRepository } from '../infrastructure/firebase/repositories/firebase-user.repository';
import { pickDatabaseRepository } from '../infrastructure/database/repository-provider.factory';

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
    PrismaCreditRepository,
    FirebaseCreditRepository,
    PrismaUserRepository,
    FirebaseUserRepository,
    {
      provide: CREDIT_REPOSITORY,
      inject: [ConfigService, PrismaCreditRepository, FirebaseCreditRepository],
      useFactory: (
        configService: ConfigService,
        prismaRepository: PrismaCreditRepository,
        firebaseRepository: FirebaseCreditRepository,
      ): ICreditRepository =>
        pickDatabaseRepository<ICreditRepository>(configService, {
          postgres: prismaRepository,
          firebase: firebaseRepository,
        }),
    },
    {
      provide: USER_REPOSITORY,
      inject: [ConfigService, PrismaUserRepository, FirebaseUserRepository],
      useFactory: (
        configService: ConfigService,
        prismaRepository: PrismaUserRepository,
        firebaseRepository: FirebaseUserRepository,
      ): IUserRepository =>
        pickDatabaseRepository<IUserRepository>(configService, {
          postgres: prismaRepository,
          firebase: firebaseRepository,
        }),
    },
  ],
  exports: [CreditService, CREDIT_REPOSITORY],
})
export class CreditModule {}
