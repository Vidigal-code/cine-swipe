"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MovieModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const movie_controller_1 = require("../presentation/controllers/movie.controller");
const movie_service_1 = require("../application/movie/movie.service");
const movie_repository_1 = require("../infrastructure/database/repositories/movie.repository");
const movie_repository_2 = require("../domain/movie/interfaces/movie.repository");
const database_module_1 = require("../infrastructure/database/database.module");
const jwt_guard_1 = require("../infrastructure/auth/guards/jwt.guard");
const shared_module_1 = require("../shared/shared.module");
const response_module_1 = require("../shared/http-response/response.module");
let MovieModule = class MovieModule {
};
exports.MovieModule = MovieModule;
exports.MovieModule = MovieModule = __decorate([
    (0, common_1.Module)({
        imports: [database_module_1.DatabaseModule, shared_module_1.SharedModule, response_module_1.ResponseModule, jwt_1.JwtModule],
        controllers: [movie_controller_1.MovieController],
        providers: [
            movie_service_1.MovieService,
            jwt_guard_1.JwtAuthGuard,
            {
                provide: movie_repository_2.MOVIE_REPOSITORY,
                useClass: movie_repository_1.PrismaMovieRepository,
            },
        ],
        exports: [movie_service_1.MovieService],
    })
], MovieModule);
//# sourceMappingURL=movie.module.js.map