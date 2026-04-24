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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const platform_express_1 = require("@nestjs/platform-express");
const auth_service_1 = require("../../application/auth/auth.service");
const jwt_guard_1 = require("../../infrastructure/auth/guards/jwt.guard");
const auth_cookie_config_1 = require("../../shared/auth/auth-cookie.config");
const login_dto_1 = require("./dto/auth/login.dto");
const refresh_dto_1 = require("./dto/auth/refresh.dto");
const register_dto_1 = require("./dto/auth/register.dto");
const update_profile_dto_1 = require("./dto/auth/update-profile.dto");
const update_password_dto_1 = require("./dto/auth/update-password.dto");
const response_factory_1 = require("../../shared/http-response/response.factory");
const auth_messages_pt_br_1 = require("../../shared/auth/auth-messages.pt-br");
const upload_security_config_1 = require("../../shared/upload/upload-security.config");
const public_backend_url_util_1 = require("../../shared/config/public-backend-url.util");
let AuthController = class AuthController {
    authService;
    configService;
    responseFactory;
    constructor(authService, configService, responseFactory) {
        this.authService = authService;
        this.configService = configService;
        this.responseFactory = responseFactory;
    }
    async register(body, response) {
        const authResult = await this.authService.register(body);
        this.setAuthCookies(response, authResult.accessToken, authResult.sessionToken, authResult.csrfToken);
        return this.responseFactory.user(authResult.user);
    }
    async login(body, response) {
        const authResult = await this.authService.login(body);
        this.setAuthCookies(response, authResult.accessToken, authResult.sessionToken, authResult.csrfToken);
        return this.responseFactory.user(authResult.user);
    }
    async refresh(request, body, response) {
        this.validateCsrfForRefresh(request);
        const sessionToken = this.extractRefreshToken(request, body);
        const authResult = await this.authService.refresh(sessionToken);
        this.setAuthCookies(response, authResult.accessToken, authResult.sessionToken, authResult.csrfToken);
        return this.responseFactory.user(authResult.user);
    }
    async me(request) {
        const userId = request.user?.sub;
        if (!userId) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.userSessionInvalid);
        }
        const profile = await this.authService.getProfile(userId);
        return this.responseFactory.user(profile);
    }
    logout(response) {
        this.clearAuthCookies(response);
        return this.responseFactory.success(true);
    }
    async updateProfile(request, body) {
        const userId = request.user?.sub;
        if (!userId) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.userSessionInvalid);
        }
        const updated = await this.authService.updateProfile(userId, body);
        return this.responseFactory.user(updated);
    }
    async updatePassword(request, body) {
        const userId = request.user?.sub;
        if (!userId) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.userSessionInvalid);
        }
        await this.authService.updatePassword(userId, body.currentPassword, body.newPassword);
        return this.responseFactory.success(true);
    }
    async uploadAvatar(request, file) {
        const userId = request.user?.sub;
        if (!userId) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.userSessionInvalid);
        }
        if (!file) {
            throw new common_1.BadRequestException('Arquivo de avatar obrigatorio.');
        }
        const backendBaseUrl = (0, public_backend_url_util_1.buildPublicBackendUrl)(this.configService, request);
        const avatarUrl = `${backendBaseUrl}/uploads/${encodeURIComponent(file.filename)}`;
        const updated = await this.authService.updateAvatar(userId, avatarUrl);
        return this.responseFactory.user(updated);
    }
    extractRefreshToken(request, body) {
        const fromCookie = request.cookies?.[auth_cookie_config_1.REFRESH_TOKEN_COOKIE];
        if (fromCookie) {
            return fromCookie;
        }
        if (body.sessionToken) {
            return body.sessionToken;
        }
        throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.refreshTokenRequired);
    }
    validateCsrfForRefresh(request) {
        if (!(0, auth_cookie_config_1.csrfEnabled)(this.configService)) {
            return;
        }
        const csrfCookie = request.cookies?.[auth_cookie_config_1.CSRF_TOKEN_COOKIE];
        const csrfHeader = request.headers[auth_cookie_config_1.CSRF_HEADER_NAME];
        if (!csrfCookie || !csrfHeader || csrfCookie !== csrfHeader) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.csrfValidationFailed);
        }
    }
    setAuthCookies(response, accessToken, refreshToken, csrfToken) {
        response.cookie(auth_cookie_config_1.ACCESS_TOKEN_COOKIE, accessToken, (0, auth_cookie_config_1.buildCookieOptions)(this.configService, 'access'));
        response.cookie(auth_cookie_config_1.REFRESH_TOKEN_COOKIE, refreshToken, (0, auth_cookie_config_1.buildCookieOptions)(this.configService, 'refresh'));
        response.cookie(auth_cookie_config_1.CSRF_TOKEN_COOKIE, csrfToken, (0, auth_cookie_config_1.buildCookieOptions)(this.configService, 'csrf'));
    }
    clearAuthCookies(response) {
        response.clearCookie(auth_cookie_config_1.ACCESS_TOKEN_COOKIE, (0, auth_cookie_config_1.buildCookieOptions)(this.configService, 'access'));
        response.clearCookie(auth_cookie_config_1.REFRESH_TOKEN_COOKIE, (0, auth_cookie_config_1.buildCookieOptions)(this.configService, 'refresh'));
        response.clearCookie(auth_cookie_config_1.CSRF_TOKEN_COOKIE, (0, auth_cookie_config_1.buildCookieOptions)(this.configService, 'csrf'));
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)('register'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [register_dto_1.RegisterDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('refresh'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, refresh_dto_1.RefreshDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)('me'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)('logout'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Put)('profile'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_profile_dto_1.UpdateProfileDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Put)('password'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, update_password_dto_1.UpdatePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "updatePassword", null);
__decorate([
    (0, common_1.Post)('avatar/upload'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', (0, upload_security_config_1.buildAvatarUploadOptions)())),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "uploadAvatar", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService,
        response_factory_1.ResponseFactory])
], AuthController);
//# sourceMappingURL=auth.controller.js.map