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
exports.AdminUserController = void 0;
const common_1 = require("@nestjs/common");
const admin_user_service_1 = require("../../application/admin-user/admin-user.service");
const user_entity_1 = require("../../domain/user/entities/user.entity");
const jwt_guard_1 = require("../../infrastructure/auth/guards/jwt.guard");
const roles_decorator_1 = require("../../infrastructure/auth/roles.decorator");
const response_factory_1 = require("../../shared/http-response/response.factory");
const pagination_query_dto_1 = require("../../shared/pagination/pagination-query.dto");
const create_admin_user_dto_1 = require("./dto/admin-user/create-admin-user.dto");
const update_admin_user_dto_1 = require("./dto/admin-user/update-admin-user.dto");
const update_admin_user_role_dto_1 = require("./dto/admin-user/update-admin-user-role.dto");
let AdminUserController = class AdminUserController {
    adminUserService;
    responseFactory;
    constructor(adminUserService, responseFactory) {
        this.adminUserService = adminUserService;
        this.responseFactory = responseFactory;
    }
    async listUsers(query) {
        const users = await this.adminUserService.listUsers(query);
        return this.responseFactory.paginated(users);
    }
    async createUser(body) {
        const user = await this.adminUserService.createUser(body);
        return this.responseFactory.resource(user);
    }
    async updateUser(id, body) {
        const updatedUser = await this.adminUserService.updateUser(id, body);
        return this.responseFactory.resource(updatedUser);
    }
    async updateUserRole(id, request, body) {
        const updatedUser = await this.adminUserService.updateUserRole(id, body.role, request.user?.sub ?? '');
        return this.responseFactory.resource(updatedUser);
    }
    async deleteUser(id, request) {
        await this.adminUserService.deleteUser(id, request.user?.sub ?? '');
        return this.responseFactory.success(true);
    }
};
exports.AdminUserController = AdminUserController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "listUsers", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_admin_user_dto_1.CreateAdminUserDto]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "createUser", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_admin_user_dto_1.UpdateAdminUserDto]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Patch)(':id/role'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_admin_user_role_dto_1.UpdateAdminUserRoleDto]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "updateUserRole", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminUserController.prototype, "deleteUser", null);
exports.AdminUserController = AdminUserController = __decorate([
    (0, common_1.Controller)('admin/users'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [admin_user_service_1.AdminUserService,
        response_factory_1.ResponseFactory])
], AdminUserController);
//# sourceMappingURL=admin-user.controller.js.map