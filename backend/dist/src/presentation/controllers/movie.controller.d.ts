import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { MovieService } from '../../application/movie/movie.service';
import { Movie } from '../../domain/movie/entities/movie.entity';
import { PaginationQueryDto } from '../../shared/pagination/pagination-query.dto';
import { CreateMovieDto } from './dto/movie/create-movie.dto';
import { UpdateMovieDto } from './dto/movie/update-movie.dto';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import type { PaginatedResponse, UploadResponse } from '../../shared/http-response/response.types';
export declare class MovieController {
    private readonly movieService;
    private readonly configService;
    private readonly responseFactory;
    constructor(movieService: MovieService, configService: ConfigService, responseFactory: ResponseFactory);
    create(movieData: CreateMovieDto): Promise<Movie>;
    uploadFile(request: Request, file: Express.Multer.File): UploadResponse;
    findAll(paginationQuery: PaginationQueryDto): Promise<PaginatedResponse<Movie>>;
    findOne(id: string): Promise<Movie>;
    update(id: string, movieData: UpdateMovieDto): Promise<Movie>;
    remove(id: string): Promise<void>;
}
