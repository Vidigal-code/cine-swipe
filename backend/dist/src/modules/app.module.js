"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const database_module_1 = require("../infrastructure/database/database.module");
const movie_module_1 = require("./movie.module");
const auth_module_1 = require("./auth.module");
const payment_module_1 = require("./payment.module");
const credit_module_1 = require("./credit.module");
const admin_user_module_1 = require("./admin-user.module");
const nestjs_pino_1 = require("nestjs-pino");
const config_2 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const core_1 = require("@nestjs/core");
const roles_guard_1 = require("../infrastructure/auth/guards/roles.guard");
const crypto_1 = require("crypto");
const health_controller_1 = require("../presentation/controllers/health.controller");
const response_module_1 = require("../shared/http-response/response.module");
const env_number_util_1 = require("../shared/config/env-number.util");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                envFilePath: ['../.env', '.env'],
                isGlobal: true,
            }),
            nestjs_pino_1.LoggerModule.forRootAsync({
                inject: [config_2.ConfigService],
                useFactory: (configService) => ({
                    pinoHttp: {
                        level: configService.get('LOG_LEVEL', 'info'),
                        transport: configService.get('APP_ENV', 'local') === 'local'
                            ? { target: 'pino-pretty' }
                            : undefined,
                        genReqId: (req, res) => {
                            const existing = req.headers['x-request-id'];
                            if (typeof existing === 'string') {
                                return existing;
                            }
                            const generatedId = (0, crypto_1.randomUUID)();
                            res.setHeader('x-request-id', generatedId);
                            return generatedId;
                        },
                    },
                }),
            }),
            throttler_1.ThrottlerModule.forRootAsync({
                inject: [config_2.ConfigService],
                useFactory: (configService) => {
                    const rateLimitPermits = (0, env_number_util_1.readPositiveIntConfig)(configService, 'RATE_LIMIT_PERMITS', 150);
                    const rateLimitWindowMinutes = (0, env_number_util_1.readPositiveIntConfig)(configService, 'RATE_LIMIT_WINDOW_MINUTES', 1);
                    const rateLimitQueue = (0, env_number_util_1.readPositiveIntConfig)(configService, 'RATE_LIMIT_QUEUE', 5);
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
            database_module_1.DatabaseModule,
            response_module_1.ResponseModule,
            movie_module_1.MovieModule,
            auth_module_1.AuthModule,
            payment_module_1.PaymentModule,
            credit_module_1.CreditModule,
            admin_user_module_1.AdminUserModule,
        ],
        controllers: [health_controller_1.HealthController],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: throttler_1.ThrottlerGuard,
            },
            {
                provide: core_1.APP_GUARD,
                useClass: roles_guard_1.RolesGuard,
            },
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map