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
exports.PrismaUserRepository = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const user_entity_1 = require("../../../domain/user/entities/user.entity");
const prisma_service_1 = require("../prisma.service");
const DEFAULT_USER_VALUES = {
    username: '',
    email: '',
    role: user_entity_1.UserRole.USER,
    creditsBalance: 0,
};
let PrismaUserRepository = class PrismaUserRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(userData) {
        const createdUser = await this.prisma.user.create({
            data: this.toCreateInput(userData),
        });
        return this.toDomain(createdUser);
    }
    async findByEmail(email) {
        return this.findUniqueAsDomain({ email });
    }
    async findByUsername(username) {
        return this.findUniqueAsDomain({ username });
    }
    async findById(id) {
        return this.findUniqueAsDomain({ id });
    }
    async findByFirebaseUid(firebaseUid) {
        return this.findUniqueAsDomain({ firebaseUid });
    }
    async findByReferralCode(referralCode) {
        return this.findUniqueAsDomain({ referralCode });
    }
    async findPage(params) {
        const [users, total] = await Promise.all([
            this.prisma.user.findMany({
                skip: params.skip,
                take: params.limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.user.count(),
        ]);
        return {
            items: users.map((user) => this.toDomain(user)),
            total,
        };
    }
    async countByRole(role) {
        return this.prisma.user.count({
            where: {
                role: this.toPrismaRole(role),
            },
        });
    }
    async update(id, user) {
        const updated = await this.prisma.user.update({
            where: { id },
            data: this.toUpdateInput(user),
        });
        return this.toDomain(updated);
    }
    async delete(id) {
        await this.prisma.user.delete({
            where: { id },
        });
    }
    toCreateInput(userData) {
        return {
            username: this.resolveUsername(userData),
            email: userData.email ?? DEFAULT_USER_VALUES.email,
            passwordHash: userData.passwordHash ?? null,
            firebaseUid: userData.firebaseUid ?? null,
            role: this.toPrismaRole(userData.role),
            creditsBalance: userData.creditsBalance ?? DEFAULT_USER_VALUES.creditsBalance,
            avatarUrl: userData.avatarUrl ?? null,
            referralCode: this.resolveReferralCode(userData),
            referredByUserId: userData.referredByUserId ?? null,
            firstApprovedCreditPurchaseDone: userData.firstApprovedCreditPurchaseDone ?? false,
            referralSignupBonusGranted: userData.referralSignupBonusGranted ?? false,
        };
    }
    resolveUsername(userData) {
        return userData.username ?? userData.email ?? DEFAULT_USER_VALUES.username;
    }
    resolveReferralCode(userData) {
        if (userData.referralCode && userData.referralCode.trim().length > 0) {
            return userData.referralCode;
        }
        return `ref_${(0, crypto_1.randomUUID)().replace(/-/g, '').slice(0, 12)}`;
    }
    async findUniqueAsDomain(where) {
        const user = await this.prisma.user.findUnique({ where });
        return user ? this.toDomain(user) : null;
    }
    toUpdateInput(user) {
        return {
            username: user.username,
            email: user.email,
            passwordHash: user.passwordHash,
            firebaseUid: user.firebaseUid,
            role: user.role ? this.toPrismaRole(user.role) : undefined,
            creditsBalance: user.creditsBalance,
            avatarUrl: user.avatarUrl,
            referralCode: user.referralCode,
            referredByUserId: user.referredByUserId,
            firstApprovedCreditPurchaseDone: user.firstApprovedCreditPurchaseDone,
            referralSignupBonusGranted: user.referralSignupBonusGranted,
        };
    }
    toPrismaRole(role) {
        return role ?? DEFAULT_USER_VALUES.role;
    }
    toDomain(user) {
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            passwordHash: user.passwordHash,
            firebaseUid: user.firebaseUid,
            role: user.role,
            creditsBalance: user.creditsBalance,
            avatarUrl: user.avatarUrl,
            referralCode: user.referralCode,
            referredByUserId: user.referredByUserId,
            firstApprovedCreditPurchaseDone: user.firstApprovedCreditPurchaseDone,
            referralSignupBonusGranted: user.referralSignupBonusGranted,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
        };
    }
};
exports.PrismaUserRepository = PrismaUserRepository;
exports.PrismaUserRepository = PrismaUserRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaUserRepository);
//# sourceMappingURL=user.repository.js.map