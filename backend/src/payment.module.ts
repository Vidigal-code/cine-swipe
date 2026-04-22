import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt'; // needed for auth guard in controller

import { Purchase } from './domain/payment/entities/purchase.entity';
import { PaymentController } from './presentation/controllers/payment.controller';
import { PaymentWorker } from './presentation/workers/payment.worker';
import { PaymentService } from './application/payment/payment.service';
import { TypeOrmPurchaseRepository } from './infrastructure/database/repositories/purchase.repository';
import { PURCHASE_REPOSITORY } from './domain/payment/interfaces/purchase.repository';

import { RabbitMQModule } from './infrastructure/messaging/rabbitmq.module';
import { MovieModule } from './movie.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Purchase]),
        RabbitMQModule,
        MovieModule,
        JwtModule, // required to inject JwtService in JwtAuthGuard
    ],
    controllers: [PaymentController, PaymentWorker],
    providers: [
        PaymentService,
        {
            provide: PURCHASE_REPOSITORY,
            useClass: TypeOrmPurchaseRepository,
        },
    ],
})
export class PaymentModule { }
