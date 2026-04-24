import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '../infrastructure/database/database.module';
import { MovieModule } from './movie.module';
import { AuthModule } from './auth.module';
import { PaymentModule } from './payment.module';
import { CreditModule } from './credit.module';
import { AdminUserModule } from './admin-user.module';
import { LoggerModule } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from '../infrastructure/auth/guards/roles.guard';
import { randomUUID } from 'crypto';
import { HealthController } from '../presentation/controllers/health.controller';
import { ResponseModule } from '../shared/http-response/response.module';
import { readPositiveIntConfig } from '../shared/config/env-number.util';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['../.env', '.env'],
      isGlobal: true,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level: configService.get<string>('LOG_LEVEL', 'info'),
          transport:
            configService.get<string>('APP_ENV', 'local') === 'local'
              ? { target: 'pino-pretty' }
              : undefined,
          genReqId: (req, res) => {
            const existing = req.headers['x-request-id'];
            if (typeof existing === 'string') {
              return existing;
            }
            const generatedId = randomUUID();
            res.setHeader('x-request-id', generatedId);
            return generatedId;
          },
        },
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const rateLimitPermits = readPositiveIntConfig(
          configService,
          'RATE_LIMIT_PERMITS',
          150,
        );
        const rateLimitWindowMinutes = readPositiveIntConfig(
          configService,
          'RATE_LIMIT_WINDOW_MINUTES',
          1,
        );
        const rateLimitQueue = readPositiveIntConfig(
          configService,
          'RATE_LIMIT_QUEUE',
          5,
        );

        return {
          throttlers: [
            {
              limit: rateLimitPermits,
              ttl: rateLimitWindowMinutes * 60 * 1000,
              blockDuration: rateLimitQueue,
            },
          ],
        };
      },
    }),
    DatabaseModule,
    ResponseModule,
    MovieModule,
    AuthModule,
    PaymentModule,
    CreditModule,
    AdminUserModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
