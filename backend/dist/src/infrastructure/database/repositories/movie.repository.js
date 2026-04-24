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
exports.PrismaMovieRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma.service");
const DEFAULT_MOVIE_VALUES = {
    title: '',
    synopsis: '',
    genre: '',
    price: 0,
    posterUrl: null,
    trailerUrl: null,
};
const ORDER_BY_CREATED_DESC = { createdAt: 'desc' };
let PrismaMovieRepository = class PrismaMovieRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(movie) {
        const createdMovie = await this.prisma.movie.create({
            data: this.buildCreateData(movie),
        });
        return this.toDomain(createdMovie);
    }
    async findAll() {
        const movies = await this.prisma.movie.findMany({
            orderBy: ORDER_BY_CREATED_DESC,
        });
        return this.toDomainList(movies);
    }
    async findPage(params) {
        const [movies, total] = await this.prisma.$transaction([
            this.prisma.movie.findMany({
                orderBy: ORDER_BY_CREATED_DESC,
                skip: params.skip,
                take: params.limit,
            }),
            this.prisma.movie.count(),
        ]);
        return {
            items: this.toDomainList(movies),
            total,
        };
    }
    async findById(id) {
        const movie = await this.prisma.movie.findUnique({ where: { id } });
        return movie ? this.toDomain(movie) : null;
    }
    async update(id, movie) {
        const updatedMovie = await this.prisma.movie.update({
            where: { id },
            data: this.buildUpdateData(movie),
        });
        return this.toDomain(updatedMovie);
    }
    async delete(id) {
        await this.prisma.movie.delete({ where: { id } });
    }
    buildCreateData(movie) {
        return {
            title: movie.title ?? DEFAULT_MOVIE_VALUES.title,
            synopsis: movie.synopsis ?? DEFAULT_MOVIE_VALUES.synopsis,
            genre: movie.genre ?? DEFAULT_MOVIE_VALUES.genre,
            price: movie.price ?? DEFAULT_MOVIE_VALUES.price,
            posterUrl: movie.posterUrl ?? DEFAULT_MOVIE_VALUES.posterUrl,
            trailerUrl: movie.trailerUrl ?? DEFAULT_MOVIE_VALUES.trailerUrl,
        };
    }
    buildUpdateData(movie) {
        return {
            title: movie.title,
            synopsis: movie.synopsis,
            genre: movie.genre,
            price: movie.price,
            posterUrl: movie.posterUrl,
            trailerUrl: movie.trailerUrl,
        };
    }
    toDomainList(movies) {
        return movies.map((movie) => this.toDomain(movie));
    }
    toDomain(movie) {
        return {
            id: movie.id,
            title: movie.title,
            synopsis: movie.synopsis,
            genre: movie.genre,
            price: typeof movie.price === 'number' ? movie.price : movie.price.toNumber(),
            posterUrl: movie.posterUrl,
            trailerUrl: movie.trailerUrl,
            createdAt: movie.createdAt,
            updatedAt: movie.updatedAt,
        };
    }
};
exports.PrismaMovieRepository = PrismaMovieRepository;
exports.PrismaMovieRepository = PrismaMovieRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaMovieRepository);
//# sourceMappingURL=movie.repository.js.map