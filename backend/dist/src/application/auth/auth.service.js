"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const config_1 = require("@nestjs/config");
const jose_1 = require("jose");
const crypto_1 = require("crypto");
const user_repository_1 = require("../../domain/user/interfaces/user.repository");
const user_entity_1 = require("../../domain/user/entities/user.entity");
const auth_provider_service_1 = require("./auth-provider.service");
const password_policy_1 = require("../../shared/auth/password-policy");
const auth_messages_pt_br_1 = require("../../shared/auth/auth-messages.pt-br");
const referral_code_util_1 = require("../../shared/auth/referral-code.util");
const credit_service_1 = require("../credit/credit.service");
const credit_messages_pt_br_1 = require("../../shared/credit/credit-messages.pt-br");
let AuthService = class AuthService {
    userRepository;
    jwtService;
    configService;
    authProviderService;
    creditService;
    constructor(userRepository, jwtService, configService, authProviderService, creditService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.configService = configService;
        this.authProviderService = authProviderService;
        this.creditService = creditService;
    }
    async register(input) {
        const provider = this.authProviderService.getAuthProvider();
        const role = this.resolveRole(input.role, input.email);
        const registrationContext = await this.resolveRegistrationContext(input);
        const registrationResult = provider === 'firebase'
            ? await this.registerWithFirebase(input, role, registrationContext)
            : {
                user: await this.registerWithLocalCredentials(input, role, registrationContext),
                isNewlyCreated: true,
            };
        if (registrationResult.isNewlyCreated) {
            await this.creditService.applyRegistrationBonuses(registrationResult.user.id);
        }
        return this.buildAuthResult(registrationResult.user);
    }
    async login(input) {
        const provider = this.authProviderService.getAuthProvider();
        const user = provider === 'firebase'
            ? await this.loginWithFirebase(input)
            : await this.loginWithLocalCredentials(input);
        return this.buildAuthResult(user);
    }
    async refresh(sessionToken) {
        if (!sessionToken) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.sessionTokenRequired);
        }
        const payload = await this.decryptSessionToken(sessionToken);
        const user = await this.userRepository.findById(payload.sub);
        if (!user) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.sessionNoLongerValid);
        }
        return this.buildAuthResult(user);
    }
    async getProfile(userId) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.userSessionNoLongerValid);
        }
        return this.removeSensitiveFields(user);
    }
    async updateProfile(userId, input) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.userSessionNoLongerValid);
        }
        if (input.email && input.email !== user.email) {
            const existing = await this.userRepository.findByEmail(input.email);
            if (existing && existing.id !== user.id) {
                throw new common_1.ConflictException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.emailAlreadyInUse);
            }
        }
        const updated = await this.userRepository.update(user.id, {
            username: input.username ?? user.username,
            email: input.email ?? user.email,
        });
        return this.removeSensitiveFields(updated);
    }
    async updatePassword(userId, currentPassword, newPassword) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.userSessionNoLongerValid);
        }
        if (!user.passwordHash) {
            throw new common_1.BadRequestException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.passwordUpdateNotAvailable);
        }
        const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isMatch) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.currentPasswordInvalid);
        }
        this.ensureStrongPassword(newPassword);
        const passwordHash = await bcrypt.hash(newPassword, 10);
        await this.userRepository.update(user.id, { passwordHash });
    }
    async updateAvatar(userId, avatarUrl) {
        const user = await this.userRepository.findById(userId);
        if (!user) {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.userSessionNoLongerValid);
        }
        const updated = await this.userRepository.update(user.id, { avatarUrl });
        return this.removeSensitiveFields(updated);
    }
    async registerWithLocalCredentials(input, role, registrationContext) {
        const { email, password } = this.ensureLocalCredentials(input);
        const existing = await this.userRepository.findByEmail(email);
        if (existing) {
            throw new common_1.ConflictException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.emailAlreadyInUse);
        }
        this.ensureStrongPassword(password);
        const passwordHash = await bcrypt.hash(password, 10);
        return this.userRepository.create({
            username: input.username ?? this.buildUsername(email),
            email,
            passwordHash,
            role,
            referralCode: registrationContext.referralCode,
            referredByUserId: registrationContext.referredByUserId,
        });
    }
    async registerWithFirebase(input, role, registrationContext) {
        const firebaseIdToken = this.ensureFirebaseIdToken(input.firebaseIdToken);
        return this.authProviderService.resolveOrCreateFirebaseUser(firebaseIdToken, {
            requestedRole: role,
            referralCode: registrationContext.referralCode,
            referredByUserId: registrationContext.referredByUserId,
        });
    }
    async loginWithLocalCredentials(input) {
        const { email, password } = this.ensureLocalCredentials(input);
        const user = await this.userRepository.findByEmail(email);
        if (!user || !user.passwordHash) {
            this.throwInvalidCredentials();
        }
        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            this.throwInvalidCredentials();
        }
        return user;
    }
    async loginWithFirebase(input) {
        const firebaseIdToken = this.ensureFirebaseIdToken(input.firebaseIdToken);
        const result = await this.authProviderService.resolveOrCreateFirebaseUser(firebaseIdToken);
        if (result.isNewlyCreated) {
            await this.creditService.applyRegistrationBonuses(result.user.id);
        }
        return result.user;
    }
    async buildAuthResult(user) {
        const payload = this.buildUserPayload(user);
        const accessToken = this.jwtService.sign(payload);
        const sessionToken = await this.encryptSessionToken(payload);
        const csrfToken = this.createCsrfToken();
        const sanitizedUser = this.removeSensitiveFields(user);
        return {
            user: sanitizedUser,
            token: accessToken,
            accessToken,
            sessionToken,
            csrfToken,
        };
    }
    buildUserPayload(user) {
        return {
            sub: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
        };
    }
    createCsrfToken() {
        return (0, crypto_1.randomBytes)(24).toString('hex');
    }
    async encryptSessionToken(payload) {
        return new jose_1.EncryptJWT(payload)
            .setProtectedHeader({ alg: 'dir', enc: 'A256GCM', typ: 'JWE' })
            .setIssuedAt()
            .setExpirationTime(this.getSessionTtl())
            .encrypt(this.getJweSecretKey());
    }
    async decryptSessionToken(sessionToken) {
        try {
            const decrypted = await (0, jose_1.jwtDecrypt)(sessionToken, this.getJweSecretKey());
            return decrypted.payload;
        }
        catch {
            throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.invalidOrExpiredSessionToken);
        }
    }
    getJweSecretKey() {
        const secret = this.configService.get('AUTH_JWE_SECRET', 'local-dev-jwe-secret');
        const hashed = (0, crypto_1.createHash)('sha256').update(secret).digest();
        return new Uint8Array(hashed);
    }
    getSessionTtl() {
        return this.configService.get('AUTH_JWE_EXPIRATION', '7d');
    }
    removeSensitiveFields(user) {
        const { passwordHash: _passwordHash, ...safeUser } = user;
        return safeUser;
    }
    buildUsername(email) {
        return email.split('@')[0].slice(0, 40);
    }
    resolveRole(requestedRole, email) {
        if (requestedRole !== user_entity_1.UserRole.ADMIN) {
            return user_entity_1.UserRole.USER;
        }
        const adminEmail = this.configService.get('ADMIN_EMAIL');
        if (adminEmail && email === adminEmail) {
            return user_entity_1.UserRole.ADMIN;
        }
        return user_entity_1.UserRole.USER;
    }
    ensureStrongPassword(password) {
        if (!password_policy_1.STRONG_PASSWORD_REGEX.test(password)) {
            throw new common_1.BadRequestException(password_policy_1.STRONG_PASSWORD_MESSAGE);
        }
    }
    ensureLocalCredentials(input) {
        if (!input.email || !input.password) {
            throw new common_1.BadRequestException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.emailAndPasswordRequired);
        }
        return {
            email: input.email,
            password: input.password,
        };
    }
    ensureFirebaseIdToken(firebaseIdToken) {
        if (!firebaseIdToken) {
            throw new common_1.BadRequestException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.firebaseIdTokenRequired());
        }
        return firebaseIdToken;
    }
    throwInvalidCredentials() {
        throw new common_1.UnauthorizedException(auth_messages_pt_br_1.AUTH_MESSAGES_PT_BR.invalidCredentials);
    }
    async resolveRegistrationContext(input) {
        if (!input.referralCode) {
            return {
                referralCode: (0, referral_code_util_1.generateReferralCode)(),
                referredByUserId: null,
            };
        }
        const referrer = await this.userRepository.findByReferralCode(input.referralCode);
        if (!referrer) {
            throw new common_1.BadRequestException(credit_messages_pt_br_1.CREDIT_MESSAGES_PT_BR.invalidRegistrationReferralCode);
        }
        if (input.email && referrer.email === input.email) {
            throw new common_1.BadRequestException(credit_messages_pt_br_1.CREDIT_MESSAGES_PT_BR.referralCodeSelfReference);
        }
        return {
            referralCode: (0, referral_code_util_1.generateReferralCode)(),
            referredByUserId: referrer.id,
        };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_1.USER_REPOSITORY)),
    __metadata("design:paramtypes", [Object, jwt_1.JwtService,
        config_1.ConfigService,
        auth_provider_service_1.AuthProviderService,
        credit_service_1.CreditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map