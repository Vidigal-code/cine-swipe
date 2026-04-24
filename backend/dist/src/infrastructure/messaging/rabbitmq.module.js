"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RabbitMQModule = exports.PAYMENT_DLQ_CLIENT = exports.PAYMENT_QUEUE_CLIENT = void 0;
const common_1 = require("@nestjs/common");
const microservices_1 = require("@nestjs/microservices");
const config_1 = require("@nestjs/config");
exports.PAYMENT_QUEUE_CLIENT = 'PAYMENT_QUEUE_CLIENT';
exports.PAYMENT_DLQ_CLIENT = 'PAYMENT_DLQ_CLIENT';
const DEFAULT_RABBITMQ_URL = 'amqp://guest:guest@localhost:5672';
const DEFAULT_PAYMENT_QUEUE = 'payment_queue';
const DEFAULT_PAYMENT_DLQ = 'payment_queue_dlq';
let RabbitMQModule = class RabbitMQModule {
};
exports.RabbitMQModule = RabbitMQModule;
exports.RabbitMQModule = RabbitMQModule = __decorate([
    (0, common_1.Module)({
        imports: [
            microservices_1.ClientsModule.registerAsync([
                {
                    name: exports.PAYMENT_QUEUE_CLIENT,
                    imports: [config_1.ConfigModule],
                    inject: [config_1.ConfigService],
                    useFactory: (configService) => ({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [
                                configService.get('RABBITMQ_URL', DEFAULT_RABBITMQ_URL),
                            ],
                            queue: configService.get('RABBITMQ_PAYMENT_QUEUE', DEFAULT_PAYMENT_QUEUE),
                            queueOptions: {
                                durable: true,
                                arguments: {
                                    'x-dead-letter-exchange': '',
                                    'x-dead-letter-routing-key': configService.get('RABBITMQ_PAYMENT_DLQ', DEFAULT_PAYMENT_DLQ),
                                },
                            },
                            persistent: true,
                        },
                    }),
                },
                {
                    name: exports.PAYMENT_DLQ_CLIENT,
                    imports: [config_1.ConfigModule],
                    inject: [config_1.ConfigService],
                    useFactory: (configService) => ({
                        transport: microservices_1.Transport.RMQ,
                        options: {
                            urls: [
                                configService.get('RABBITMQ_URL', DEFAULT_RABBITMQ_URL),
                            ],
                            queue: configService.get('RABBITMQ_PAYMENT_DLQ', DEFAULT_PAYMENT_DLQ),
                            queueOptions: {
                                durable: true,
                            },
                            persistent: true,
                        },
                    }),
                },
            ]),
        ],
        exports: [microservices_1.ClientsModule],
    })
], RabbitMQModule);
//# sourceMappingURL=rabbitmq.module.js.map