"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResponseFactory = void 0;
const common_1 = require("@nestjs/common");
const response_constants_1 = require("./response.constants");
let ResponseFactory = class ResponseFactory {
    resource(resource) {
        return resource;
    }
    user(user) {
        return {
            [response_constants_1.RESPONSE_FIELD_KEYS.user]: user,
        };
    }
    paginated(resultOrData, meta) {
        const paginatedResult = this.resolvePaginatedPayload(resultOrData, meta);
        return {
            [response_constants_1.RESPONSE_FIELD_KEYS.data]: paginatedResult.data,
            [response_constants_1.RESPONSE_FIELD_KEYS.meta]: paginatedResult.meta,
        };
    }
    upload(url) {
        return {
            [response_constants_1.RESPONSE_FIELD_KEYS.url]: url,
        };
    }
    success(value = true) {
        return {
            [response_constants_1.RESPONSE_FIELD_KEYS.success]: value,
        };
    }
    received() {
        return {
            [response_constants_1.RESPONSE_FIELD_KEYS.received]: true,
        };
    }
    health(status = response_constants_1.RESPONSE_STATUS_VALUES.ok) {
        return {
            [response_constants_1.RESPONSE_FIELD_KEYS.status]: status,
        };
    }
    resolvePaginatedPayload(resultOrData, meta) {
        if (Array.isArray(resultOrData)) {
            if (!meta) {
                throw new Error('Pagination meta is required when data array is provided');
            }
            return { data: resultOrData, meta };
        }
        return resultOrData;
    }
};
exports.ResponseFactory = ResponseFactory;
exports.ResponseFactory = ResponseFactory = __decorate([
    (0, common_1.Injectable)()
], ResponseFactory);
//# sourceMappingURL=response.factory.js.map