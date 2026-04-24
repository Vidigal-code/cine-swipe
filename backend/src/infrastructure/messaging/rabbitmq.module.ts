import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

export const PAYMENT_QUEUE_CLIENT = 'PAYMENT_QUEUE_CLIENT';
export const PAYMENT_DLQ_CLIENT = 'PAYMENT_DLQ_CLIENT';

const DEFAULT_RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
const DEFAULT_PAYMENT_QUEUE = 'payment_queue';
const DEFAULT_PAYMENT_DLQ = 'payment_queue_dlq';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: PAYMENT_QUEUE_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URL', DEFAULT_RABBITMQ_URL),
            ],
            queue: configService.get<string>(
              'RABBITMQ_PAYMENT_QUEUE',
              DEFAULT_PAYMENT_QUEUE,
            ),
            queueOptions: {
              durable: true,
              arguments: {
                'x-dead-letter-exchange': '',
                'x-dead-letter-routing-key': configService.get<string>(
                  'RABBITMQ_PAYMENT_DLQ',
                  DEFAULT_PAYMENT_DLQ,
                ),
              },
            },
            persistent: true,
          },
        }),
      },
      {
        name: PAYMENT_DLQ_CLIENT,
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            urls: [
              configService.get<string>('RABBITMQ_URL', DEFAULT_RABBITMQ_URL),
            ],
            queue: configService.get<string>(
              'RABBITMQ_PAYMENT_DLQ',
              DEFAULT_PAYMENT_DLQ,
            ),
            queueOptions: {
              durable: true,
            },
            persistent: true,
          },
        }),
      },
    ]),
  ],
  exports: [ClientsModule],
})
export class RabbitMQModule {}
