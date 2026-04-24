"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./modules/app.module");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const microservices_1 = require("@nestjs/microservices");
const path_1 = require("path");
const nestjs_pino_1 = require("nestjs-pino");
const helmet_1 = __importDefault(require("helmet"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const cors_config_1 = require("./shared/cors.config");
const api_logger_1 = require("./shared/logger/api-logger");
const env_number_util_1 = require("./shared/config/env-number.util");
const security_headers_config_1 = require("./shared/security-headers.config");
const DEFAULT_RABBITMQ_PREFETCH = 25;
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        rawBody: true,
    });
    app.useLogger(app.get(nestjs_pino_1.Logger));
    const configService = app.get(config_1.ConfigService);
    app.use((0, cookie_parser_1.default)());
    app.use((0, helmet_1.default)((0, security_headers_config_1.buildHelmetOptions)(configService)));
    app.enableCors((0, cors_config_1.buildCorsOptions)(configService));
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
    }));
    const uploadsDir = configService.get('UPLOADS_DIR', 'uploads');
    app.useStaticAssets(resolveUploadsAbsolutePath(uploadsDir), {
        prefix: '/uploads/',
    });
    const port = configService.get('PORT', 3001);
    const rmqUrl = configService.get('RABBITMQ_URL', 'amqp://guest:guest@localhost:5672');
    const paymentQueue = configService.get('RABBITMQ_PAYMENT_QUEUE', 'payment_queue');
    const paymentDlq = configService.get('RABBITMQ_PAYMENT_DLQ', 'payment_queue_dlq');
    const prefetchCount = (0, env_number_util_1.readPositiveIntConfig)(configService, 'RABBITMQ_PREFETCH', DEFAULT_RABBITMQ_PREFETCH);
    app.connectMicroservice({
        transport: microservices_1.Transport.RMQ,
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
    await app.listen(port);
    api_logger_1.ApiLogger.log(`Backend is running on: http://localhost:${port}`, 'Bootstrap');
}
function resolveUploadsAbsolutePath(uploadsDir) {
    if ((0, path_1.isAbsolute)(uploadsDir)) {
        return uploadsDir;
    }
    return (0, path_1.resolve)(process.cwd(), uploadsDir);
}
bootstrap();
//# sourceMappingURL=main.js.map