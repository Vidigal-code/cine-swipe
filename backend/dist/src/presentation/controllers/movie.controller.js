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
exports.MovieController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const config_1 = require("@nestjs/config");
const movie_service_1 = require("../../application/movie/movie.service");
const jwt_guard_1 = require("../../infrastructure/auth/guards/jwt.guard");
const roles_decorator_1 = require("../../infrastructure/auth/roles.decorator");
const user_entity_1 = require("../../domain/user/entities/user.entity");
const pagination_query_dto_1 = require("../../shared/pagination/pagination-query.dto");
const upload_security_config_1 = require("../../shared/upload/upload-security.config");
const create_movie_dto_1 = require("./dto/movie/create-movie.dto");
const update_movie_dto_1 = require("./dto/movie/update-movie.dto");
const response_factory_1 = require("../../shared/http-response/response.factory");
const public_backend_url_util_1 = require("../../shared/config/public-backend-url.util");
let MovieController = class MovieController {
    movieService;
    configService;
    responseFactory;
    constructor(movieService, configService, responseFactory) {
        this.movieService = movieService;
        this.configService = configService;
        this.responseFactory = responseFactory;
    }
    async create(movieData) {
        const createdMovie = await this.movieService.createMovie(movieData);
        return this.responseFactory.resource(createdMovie);
    }
    uploadFile(request, file) {
        if (!file) {
            throw new common_1.BadRequestException('Arquivo de poster obrigatorio.');
        }
        const backendBaseUrl = (0, public_backend_url_util_1.buildPublicBackendUrl)(this.configService, request);
        const url = `${backendBaseUrl}/uploads/${encodeURIComponent(file.filename)}`;
        return this.responseFactory.upload(url);
    }
    async findAll(paginationQuery) {
        const paginatedMovies = await this.movieService.getMoviesPage(paginationQuery);
        return this.responseFactory.paginated(paginatedMovies);
    }
    async findOne(id) {
        const movie = await this.movieService.getMovieById(id);
        return this.responseFactory.resource(movie);
    }
    async update(id, movieData) {
        const updatedMovie = await this.movieService.updateMovie(id, movieData);
        return this.responseFactory.resource(updatedMovie);
    }
    async remove(id) {
        return this.movieService.deleteMovie(id);
    }
};
exports.MovieController = MovieController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_movie_dto_1.CreateMovieDto]),
    __metadata("design:returntype", Promise)
], MovieController.prototype, "create", null);
__decorate([
    (0, common_1.Post)('upload'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', (0, upload_security_config_1.buildMovieUploadOptions)())),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Object)
], MovieController.prototype, "uploadFile", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [pagination_query_dto_1.PaginationQueryDto]),
    __metadata("design:returntype", Promise)
], MovieController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MovieController.prototype, "findOne", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_movie_dto_1.UpdateMovieDto]),
    __metadata("design:returntype", Promise)
], MovieController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(jwt_guard_1.JwtAuthGuard),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.ADMIN),
    __param(0, (0, common_1.Param)('id', common_1.ParseUUIDPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MovieController.prototype, "remove", null);
exports.MovieController = MovieController = __decorate([
    (0, common_1.Controller)('movies'),
    __metadata("design:paramtypes", [movie_service_1.MovieService,
        config_1.ConfigService,
        response_factory_1.ResponseFactory])
], MovieController);
//# sourceMappingURL=movie.controller.js.map