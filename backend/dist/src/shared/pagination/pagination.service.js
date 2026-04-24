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
exports.PaginationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let PaginationService = class PaginationService {
    configService;
    constructor(configService) {
        this.configService = configService;
    }
    resolve(query) {
        const page = this.toPositiveInt(query.page, this.configService.get('PAGINATION_DEFAULT_PAGE', 1));
        const requestedLimit = this.toPositiveInt(query.limit, this.configService.get('PAGINATION_DEFAULT_LIMIT', 12));
        const maxLimit = this.configService.get('PAGINATION_MAX_LIMIT', 50);
        const limit = Math.min(requestedLimit, maxLimit);
        return {
            page,
            limit,
            skip: (page - 1) * limit,
        };
    }
    buildResult(items, total, params) {
        return {
            data: items,
            meta: this.buildMeta(total, params),
        };
    }
    buildMeta(total, params) {
        const totalPages = Math.max(1, Math.ceil(total / params.limit));
        return {
            page: params.page,
            limit: params.limit,
            total,
            totalPages,
            hasNextPage: params.page < totalPages,
            hasPreviousPage: params.page > 1,
        };
    }
    toPositiveInt(value, fallback) {
        if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
            return Math.floor(value);
        }
        if (typeof value === 'string') {
            const parsedValue = Number.parseInt(value, 10);
            if (!Number.isNaN(parsedValue) && parsedValue > 0) {
                return parsedValue;
            }
        }
        return fallback;
    }
};
exports.PaginationService = PaginationService;
exports.PaginationService = PaginationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PaginationService);
//# sourceMappingURL=pagination.service.js.map