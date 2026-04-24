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
exports.MovieService = void 0;
const common_1 = require("@nestjs/common");
const movie_repository_1 = require("../../domain/movie/interfaces/movie.repository");
const pagination_service_1 = require("../../shared/pagination/pagination.service");
let MovieService = class MovieService {
    movieRepository;
    paginationService;
    constructor(movieRepository, paginationService) {
        this.movieRepository = movieRepository;
        this.paginationService = paginationService;
    }
    async createMovie(data) {
        return this.movieRepository.create(data);
    }
    async getAllMovies() {
        return this.movieRepository.findAll();
    }
    async getMoviesPage(paginationQuery) {
        const paginationParams = this.paginationService.resolve(paginationQuery);
        const { items, total } = await this.movieRepository.findPage(paginationParams);
        return this.paginationService.buildResult(items, total, paginationParams);
    }
    async getMovieById(id) {
        const movie = await this.movieRepository.findById(id);
        if (!movie) {
            throw new common_1.NotFoundException(`Movie with ID ${id} not found`);
        }
        return movie;
    }
    async updateMovie(id, data) {
        await this.getMovieById(id);
        return this.movieRepository.update(id, data);
    }
    async deleteMovie(id) {
        await this.getMovieById(id);
        await this.movieRepository.delete(id);
    }
};
exports.MovieService = MovieService;
exports.MovieService = MovieService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(movie_repository_1.MOVIE_REPOSITORY)),
    __metadata("design:paramtypes", [Object, pagination_service_1.PaginationService])
], MovieService);
//# sourceMappingURL=movie.service.js.map