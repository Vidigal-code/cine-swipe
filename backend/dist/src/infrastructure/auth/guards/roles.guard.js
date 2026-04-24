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
exports.RolesGuard = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const core_1 = require("@nestjs/core");
const roles_decorator_1 = require("../roles.decorator");
const auth_cookie_config_1 = require("../../../shared/auth/auth-cookie.config");
const auth_messages_pt_br_1 = require("../../../shared/auth/auth-messages.pt-br");
let RolesGuard = class RolesGuard {
    reflector;
    jwtService;
    configService;
    constructor(reflector, jwtService, configService) {
        this.reflector = reflector;
        this.jwtService = jwtService;
        this.configService = configService;
    }
    async canActivate(context) {
        const requiredRoles = this.reflector.getAllAndOverride(roles_decorator_1.ROLES_KEY, [context.getHandler(), context.getClass()]);
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }
        const request = context.switchToHttp().getRequest();
        const role = await this.resolveRole(request);
        if (!role || !requiredRoles.includes(role)) {
            throw new common_1.ForbiddenException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.insufficientPermissions);
        }
        return true;
    }
    async resolveRole(request) {
        if (request.user?.role) {
            return request.user.role;
        }
        const token = this.extractToken(request);
        if (!token) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.authenticationRequired);
        }
        try {
            const secret = this.configService.getOrThrow('JWT_SECRET');
            const payload = await this.jwtService.verifyAsync(token, {
                secret,
            });
            return payload.role ?? '';
        }
        catch {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.invalidOrExpiredToken);
        }
    }
    extractToken(request) {
        const fromCookie = request.cookies?.[auth_cookie_config_1.ACCESS_TOKEN_COOKIE];
        if (fromCookie) {
            return fromCookie;
        }
        const [type, token] = request.headers.authorization?.split(' ') ?? [];
        return type === 'Bearer' ? token : undefined;
    }
};
exports.RolesGuard = RolesGuard;
exports.RolesGuard = RolesGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [core_1.Reflector,
        jwt_1.JwtService,
        config_1.ConfigService])
], RolesGuard);
//# sourceMappingURL=roles.guard.js.map