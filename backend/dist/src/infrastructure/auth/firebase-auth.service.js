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
exports.FirebaseAuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_1 = require("firebase-admin/app");
const auth_1 = require("firebase-admin/auth");
let FirebaseAuthService = class FirebaseAuthService {
    configService;
    app;
    constructor(configService) {
        this.configService = configService;
        this.app = this.createApp();
    }
    isEnabled() {
        return this.app !== null;
    }
    async verifyIdToken(idToken) {
        if (!this.app) {
            throw new common_1.UnauthorizedException('Firebase auth is not configured');
        }
        return (0, auth_1.getAuth)(this.app).verifyIdToken(idToken, true);
    }
    createApp() {
        const projectId = this.configService.get('FIREBASE_PROJECT_ID');
        const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
        const privateKey = this.configService
            .get('FIREBASE_PRIVATE_KEY')
            ?.replace(/\\n/g, '\n');
        if (projectId && clientEmail && privateKey) {
            return this.getOrCreateApp((0, app_1.cert)({
                projectId,
                clientEmail,
                privateKey,
            }));
        }
        const rawServiceAccount = this.configService.get('FIREBASE_SERVICE_ACCOUNT_JSON') ?? '';
        if (!rawServiceAccount) {
            return null;
        }
        const parsedJson = this.parseServiceAccount(rawServiceAccount);
        return this.getOrCreateApp((0, app_1.cert)(parsedJson));
    }
    parseServiceAccount(rawValue) {
        try {
            return JSON.parse(rawValue);
        }
        catch {
            const decoded = Buffer.from(rawValue, 'base64').toString('utf8');
            return JSON.parse(decoded);
        }
    }
    getOrCreateApp(credentials) {
        if ((0, app_1.getApps)().length > 0) {
            return (0, app_1.getApps)()[0];
        }
        return (0, app_1.initializeApp)({ credential: credentials });
    }
};
exports.FirebaseAuthService = FirebaseAuthService;
exports.FirebaseAuthService = FirebaseAuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FirebaseAuthService);
//# sourceMappingURL=firebase-auth.service.js.map