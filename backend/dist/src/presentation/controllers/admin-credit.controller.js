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
exports.AdminCreditController = void 0;
const common_1 = require("@nestjs/common");
const credit_service_1 = require("../../application/credit/credit.service");
const jwt_guard_1 = require("../../infrastructure/auth/guards/jwt.guard");
const roles_decorator_1 = require("../../infrastructure/auth/roles.decorator");
const user_entity_1 = require("../../domain/user/entities/user.entity");
const response_factory_1 = require("../../shared/http-response/response.factory");
const pagination_query_dto_1 = require("../../shared/pagination/pagination-query.dto");
const create_credit_plan_dto_1 = require("./dto/credit/create-credit-plan.dto");
const update_credit_plan_dto_1 = require("./dto/credit/update-credit-plan.dto");
const update_credit_system_config_dto_1 = require("./dto/credit/update-credit-system-config.dto");
let AdminCreditController = class AdminCreditController {
    creditService;
    responseFactory;
    constructor(creditService, responseFactory) {
        this.creditService = creditService;
        this.responseFactory = responseFactory;
    }
    async getPlans(query) {
        const plans = await this.creditService.listAdminPlansPage(query);
        return this.responseFactory.paginated(plans);
    }
    async createPlan(body) {
        const plan = await this.creditService.createAdminPlan(body);
        return this.responseFactory.resource(plan);
    }
    async updatePlan(id, body) {
        const plan = await this.creditService.updateAdminPlan(id, body);
        return this.responseFactory.resource(plan);
    }
    async deletePlan(id) {
        await this.creditService.deleteAdminPlan(id);
        return this.responseFactory.success(true);
    }
    async getConfig() {
        const config = await this.creditService.getAdminConfig();
        return this.responseFactory.resource(config);
    }
    async updateConfig(body) {
        const config = await this.creditService.updateAdminConfig(body);
        return this.responseFactory.resource(config);
    }
};
exports.AdminCreditController = AdminCreditController;
__decorate([
    (0, common_1.Get)('plans'),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], AdminCreditController.prototype, "getPlans", null);
__decorate([
    (0, common_1.Post)('plans'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_credit_plan_dto_1.CreateCreditPlanDto]),
    __metadata("design:returntype", Promise)
], AdminCreditController.prototype, "createPlan", null);
__decorate([
    (0, common_1.Patch)('plans/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_credit_plan_dto_1.UpdateCreditPlanDto]),
    __metadata("design:returntype", Promise)
], AdminCreditController.prototype, "updatePlan", null);
__decorate([
    (0, common_1.Delete)('plans/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminCreditController.prototype, "deletePlan", null);
__decorate([
    (0, common_1.Get)('config'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminCreditController.prototype, "getConfig", null);
__decorate([
    (0, common_1.Patch)('config'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [update_credit_system_config_dto_1.UpdateCreditSystemConfigDto]),
    __metadata("design:returntype", Promise)
], AdminCreditController.prototype, "updateConfig", null);
exports.AdminCreditController = AdminCreditController = __decorate([
    (0, common_1.Controller)('admin/credits'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __metadata("design:paramtypes", [credit_service_1.CreditService,
        response_factory_1.ResponseFactory])
], AdminCreditController);
//# sourceMappingURL=admin-credit.controller.js.map