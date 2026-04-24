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
exports.AdminUserService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const user_entity_1 = require("../../domain/user/entities/user.entity");
const user_repository_1 = require("../../domain/user/interfaces/user.repository");
const pagination_service_1 = require("../../shared/pagination/pagination.service");
const password_policy_1 = require("../../shared/auth/password-policy");
const admin_user_messages_pt_br_1 = require("../../shared/user/admin-user-messages.pt-br");
let AdminUserService = class AdminUserService {
    userRepository;
    paginationService;
    constructor(userRepository, paginationService) {
        this.userRepository = userRepository;
        this.paginationService = paginationService;
    }
    async listUsers(query) {
        const pagination = this.paginationService.resolve(query);
        const { items, total } = await this.userRepository.findPage(pagination);
        const users = items.map((user) => this.removeSensitiveFields(user));
        return this.paginationService.buildResult(users, total, pagination);
    }
    async createUser(input) {
        await this.assertEmailAvailable(input.email);
        await this.assertUsernameAvailable(input.username);
        this.ensureStrongPassword(input.password);
        const createdUser = await this.userRepository.create({
            username: input.username,
            email: input.email,
            passwordHash: await bcrypt.hash(input.password, 10),
            role: input.role ?? user_entity_1.UserRole.USER,
        });
        return this.removeSensitiveFields(createdUser);
    }
    async updateUser(id, input) {
        const user = await this.getUserOrThrow(id);
        if (input.email && input.email !== user.email) {
            await this.assertEmailAvailable(input.email, user.id);
        }
        if (input.username && input.username !== user.username) {
            await this.assertUsernameAvailable(input.username, user.id);
        }
        const updatedUser = await this.userRepository.update(user.id, {
            username: input.username ?? user.username,
            email: input.email ?? user.email,
        });
        return this.removeSensitiveFields(updatedUser);
    }
    async updateUserRole(targetUserId, role, actorUserId) {
        this.ensureActorAvailable(actorUserId);
        const user = await this.getUserOrThrow(targetUserId);
        await this.assertCanChangeRole(user, role, actorUserId);
        const updatedUser = await this.userRepository.update(user.id, { role });
        return this.removeSensitiveFields(updatedUser);
    }
    async deleteUser(targetUserId, actorUserId) {
        this.ensureActorAvailable(actorUserId);
        const user = await this.getUserOrThrow(targetUserId);
        await this.assertCanDeleteUser(user, actorUserId);
        await this.userRepository.delete(user.id);
    }
    async getUserOrThrow(id) {
        const user = await this.userRepository.findById(id);
        if (!user) {
            throw new common_1.NotFoundException(admin_user_messages_pt_br_1.ADMIN_USER_MESSAGES_PT_BR.userNotFound);
        }
        return user;
    }
    async assertEmailAvailable(email, exceptUserId) {
        const existing = await this.userRepository.findByEmail(email);
        if (existing && existing.id !== exceptUserId) {
            throw new common_1.ConflictException(admin_user_messages_pt_br_1.ADMIN_USER_MESSAGES_PT_BR.emailAlreadyInUse);
        }
    }
    async assertUsernameAvailable(username, exceptUserId) {
        const existing = await this.userRepository.findByUsername(username);
        if (existing && existing.id !== exceptUserId) {
            throw new common_1.ConflictException(admin_user_messages_pt_br_1.ADMIN_USER_MESSAGES_PT_BR.usernameAlreadyInUse);
        }
    }
    ensureStrongPassword(password) {
        if (!password_policy_1.STRONG_PASSWORD_REGEX.test(password)) {
            throw new common_1.BadRequestException(password_policy_1.STRONG_PASSWORD_MESSAGE);
        }
    }
    ensureActorAvailable(actorUserId) {
        if (!actorUserId) {
            throw new common_1.BadRequestException(admin_user_messages_pt_br_1.ADMIN_USER_MESSAGES_PT_BR.actorRequired);
        }
    }
    async assertCanDeleteUser(user, actorUserId) {
        if (user.id === actorUserId) {
            throw new common_1.BadRequestException(admin_user_messages_pt_br_1.ADMIN_USER_MESSAGES_PT_BR.cannotDeleteYourself);
        }
        await this.assertLastAdminProtection(user.role, user_entity_1.UserRole.USER);
    }
    async assertCanChangeRole(user, requestedRole, actorUserId) {
        if (user.id === actorUserId) {
            throw new common_1.BadRequestException(admin_user_messages_pt_br_1.ADMIN_USER_MESSAGES_PT_BR.cannotChangeOwnRole);
        }
        await this.assertLastAdminProtection(user.role, requestedRole);
    }
    async assertLastAdminProtection(currentRole, nextRole) {
        if (!(currentRole === user_entity_1.UserRole.ADMIN && nextRole !== user_entity_1.UserRole.ADMIN)) {
            return;
        }
        await this.ensureAdminCountAllowsChange();
    }
    async ensureAdminCountAllowsChange() {
        const adminCount = await this.userRepository.countByRole(user_entity_1.UserRole.ADMIN);
        if (adminCount <= 1) {
            throw new common_1.BadRequestException(admin_user_messages_pt_br_1.ADMIN_USER_MESSAGES_PT_BR.cannotRemoveLastAdmin);
        }
    }
    removeSensitiveFields(user) {
        const { passwordHash: _passwordHash, ...safeUser } = user;
        return safeUser;
    }
};
exports.AdminUserService = AdminUserService;
exports.AdminUserService = AdminUserService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(user_repository_1.USER_REPOSITORY)),
    __metadata("design:paramtypes", [Object, pagination_service_1.PaginationService])
], AdminUserService);
//# sourceMappingURL=admin-user.service.js.map