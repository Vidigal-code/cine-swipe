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
exports.AuthProviderService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const user_repository_1 = require("../../domain/user/interfaces/user.repository");
const user_entity_1 = require("../../domain/user/entities/user.entity");
const firebase_auth_service_1 = require("../../infrastructure/auth/firebase-auth.service");
const referral_code_util_1 = require("../../shared/auth/referral-code.util");
let AuthProviderService = class AuthProviderService {
    userRepository;
    configService;
    firebaseAuthService;
    constructor(userRepository, configService, firebaseAuthService) {
        this.userRepository = userRepository;
        this.configService = configService;
        this.firebaseAuthService = firebaseAuthService;
    }
    getAuthProvider() {
        const provider = this.configService.get('AUTH_PROVIDER', 'local');
        return provider === 'firebase' ? 'firebase' : 'local';
    }
    async resolveOrCreateFirebaseUser(firebaseIdToken, options) {
        const requestedRole = options?.requestedRole ?? user_entity_1.UserRole.USER;
        const decodedToken = await this.firebaseAuthService.verifyIdToken(firebaseIdToken);
        const email = decodedToken.email;
        const firebaseUid = decodedToken.uid;
        if (!email) {
            throw new common_1.BadRequestException('Firebase token does not contain a valid email');
        }
        const existingByFirebase = await this.userRepository.findByFirebaseUid(firebaseUid);
        if (existingByFirebase) {
            return {
                user: existingByFirebase,
                isNewlyCreated: false,
            };
        }
        const existingByEmail = await this.userRepository.findByEmail(email);
        if (existingByEmail) {
            const updatedUser = await this.userRepository.update(existingByEmail.id, {
                firebaseUid,
            });
            return {
                user: updatedUser,
                isNewlyCreated: false,
            };
        }
        const user = await this.userRepository.create({
            username: this.buildUsername(email),
            email,
            firebaseUid,
            role: requestedRole,
            passwordHash: null,
            referralCode: options?.referralCode ?? (0, referral_code_util_1.generateReferralCode)(),
            referredByUserId: options?.referredByUserId ?? null,
        });
        return {
            user,
            isNewlyCreated: true,
        };
    }
    buildUsername(email) {
        return email.split('@')[0].slice(0, 40);
    }
};
exports.AuthProviderService = AuthProviderService;
exports.AuthProviderService = AuthProviderService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_1.USER_REPOSITORY)),
    __metadata("design:paramtypes", [Object, config_1.ConfigService,
        firebase_auth_service_1.FirebaseAuthService])
], AuthProviderService);
//# sourceMappingURL=auth-provider.service.js.map