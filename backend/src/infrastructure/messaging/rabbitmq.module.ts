import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
    imports: [
        ClientsModule.registerAsync([
            {
                name: 'PAYMENT_SERVICE',
                imports: [ConfigModule],
                inject: [ConfigService],
                useFactory: (configService: ConfigService) => ({
                    transport: Transport.RMQ,
                    options: {
                        urls: [configService.get<string>('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672')],
                        queue: 'payment_queue',
                        queueOptions: {
                            durable: true,
                        },
                    },
                }),
            },
        ]),
    ],
    exports: [ClientsModule],
})
export class RabbitMQModule { }
