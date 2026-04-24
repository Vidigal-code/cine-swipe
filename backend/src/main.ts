import { NestFactory } from '@nestjs/core';
import { AppModule } from './modules/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { NestExpressApplication } from '@nestjs/platform-express';
import { isAbsolute, resolve } from 'path';
import { Logger as PinoLogger } from 'nestjs-pino';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { buildCorsOptions } from 'src/shared/cors.config';
import { ApiLogger } from 'src/shared/logger/api-logger';
import { readPositiveIntConfig } from 'src/shared/config/env-number.util';
import { buildHelmetOptions } from 'src/shared/security-headers.config';
import {
  isRmqPaymentFlow,
  validatePlatformConfig,
} from 'src/shared/config/platform.config';

const DEFAULT_RABBITMQ_PREFETCH = 25;

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true,
  });
  app.useLogger(app.get(PinoLogger));
  const configService = app.get(ConfigService);
  validatePlatformConfig(configService);

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

  // Serve static files for mock uploads
  const uploadsDir = configService.get<string>('UPLOADS_DIR', 'uploads');
  app.useStaticAssets(resolveUploadsAbsolutePath(uploadsDir), {
    prefix: '/uploads/',
  });

  const port = configService.get<number>('PORT', 3001);
  if (isRmqPaymentFlow(configService)) {
    const rmqUrl = configService.get<string>(
      'RABBITMQ_URL',
      'amqp://guest:guest@localhost:5672',
    );
    const paymentQueue = configService.get<string>(
      'RABBITMQ_PAYMENT_QUEUE',
      'payment_queue',
    );
    const paymentDlq = configService.get<string>(
      'RABBITMQ_PAYMENT_DLQ',
      'payment_queue_dlq',
    );
    const prefetchCount = readPositiveIntConfig(
      configService,
      'RABBITMQ_PREFETCH',
      DEFAULT_RABBITMQ_PREFETCH,
    );

    app.connectMicroservice<MicroserviceOptions>({
      transport: Transport.RMQ,
      options: {
        urls: [rmqUrl],
        queue: paymentQueue,
        queueOptions: {
          durable: true,
          arguments: {
            'x-dead-letter-exchange': '',
            'x-dead-letter-routing-key': paymentDlq,
          },
        },
        noAck: false,
        prefetchCount,
      },
    });

    await app.startAllMicroservices();
  }

  await app.listen(port);
  ApiLogger.log(`Backend is running on: http://localhost:${port}`, 'Bootstrap');
}

function resolveUploadsAbsolutePath(uploadsDir: string): string {
  if (isAbsolute(uploadsDir)) {
    return uploadsDir;
  }
  return resolve(process.cwd(), uploadsDir);
}
void bootstrap();
