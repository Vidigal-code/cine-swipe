"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JwtAuthGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const auth_cookie_config_1 = require("../../../shared/auth/auth-cookie.config");
const auth_messages_pt_br_1 = require("../../../shared/auth/auth-messages.pt-br");
let JwtAuthGuard = class JwtAuthGuard {
    jwtService;
    configService;
    constructor(jwtService, configService) {
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const { token, source } = this.extractToken(request);
        if (!token) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.authenticationRequired);
        }
        try {
            const secret = this.configService.getOrThrow('JWT_SECRET');
            request.user = await this.jwtService.verifyAsync(token, { secret });
            this.validateCsrfIfRequired(request, source);
        }
        catch {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.invalidOrExpiredToken);
        }
        return true;
    }
    extractToken(request) {
        const fromCookie = request.cookies?.[auth_cookie_config_1.ACCESS_TOKEN_COOKIE];
        if (fromCookie) {
            return { token: fromCookie, source: 'cookie' };
        }
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        if (type === 'Bearer' && token) {
            return { token, source: 'header' };
        }
        return { source: 'none' };
    }
    validateCsrfIfRequired(request, tokenSource) {
        if (!(0, auth_cookie_config_1.csrfEnabled)(this.configService) || tokenSource !== 'cookie') {
            return;
        }
        if (['GET', 'HEAD', 'OPTIONS'].includes(request.method.toUpperCase())) {
            return;
        }
        const csrfCookie = request.cookies?.[auth_cookie_config_1.CSRF_TOKEN_COOKIE];
        const csrfHeader = request.headers[auth_cookie_config_1.CSRF_HEADER_NAME];
        if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.csrfValidationFailed);
        }
    }
};
exports.JwtAuthGuard = JwtAuthGuard;
exports.JwtAuthGuard = JwtAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService,
        config_1.ConfigService])
], JwtAuthGuard);
//# sourceMappingURL=jwt.guard.js.map