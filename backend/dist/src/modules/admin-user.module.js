"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminUserModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const admin_user_service_1 = require("../application/admin-user/admin-user.service");
const user_repository_1 = require("../domain/user/interfaces/user.repository");
const jwt_guard_1 = require("../infrastructure/auth/guards/jwt.guard");
const database_module_1 = require("../infrastructure/database/database.module");
const user_repository_2 = require("../infrastructure/database/repositories/user.repository");
const admin_user_controller_1 = require("../presentation/controllers/admin-user.controller");
const response_module_1 = require("../shared/http-response/response.module");
const shared_module_1 = require("../shared/shared.module");
let AdminUserModule = class AdminUserModule {
};
exports.AdminUserModule = AdminUserModule;
exports.AdminUserModule = AdminUserModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, response_module_1.ResponseModule, shared_module_1.SharedModule, jwt_1.JwtModule],
        controllers: [admin_user_controller_1.AdminUserController],
        providers: [
            admin_user_service_1.AdminUserService,
            jwt_guard_1.JwtAuthGuard,
            {
                provide: user_repository_1.USER_REPOSITORY,
                useClass: user_repository_2.PrismaUserRepository,
            },
        ],
    })
], AdminUserModule);
//# sourceMappingURL=admin-user.module.js.map