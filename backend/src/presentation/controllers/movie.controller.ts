import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request } from 'express';

import { MovieService } from '../../application/movie/movie.service';
import { Movie } from '../../domain/movie/entities/movie.entity';
import { JwtAuthGuard } from '../../infrastructure/auth/guards/jwt.guard';
import { Roles } from '../../infrastructure/auth/roles.decorator';
import { UserRole } from '../../domain/user/entities/user.entity';
import { PaginationQueryDto } from '../../shared/pagination/pagination-query.dto';
import { buildMovieUploadOptions } from '../../shared/upload/upload-security.config';
import { CreateMovieDto } from './dto/movie/create-movie.dto';
import { UpdateMovieDto } from './dto/movie/update-movie.dto';
import { ResponseFactory } from '../../shared/http-response/response.factory';
import { MediaStorageService } from '../../application/media/media-storage.service';
import type {
  PaginatedResponse,
  UploadResponse,
} from '../../shared/http-response/response.types';

@Controller('movies')
export class MovieController {
  constructor(
    private readonly movieService: MovieService,
    private readonly responseFactory: ResponseFactory,
    private readonly mediaStorageService: MediaStorageService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async create(@Body() movieData: CreateMovieDto): Promise<Movie> {
    const createdMovie = await this.movieService.createMovie(movieData);
    return this.responseFactory.resource(createdMovie);
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file', buildMovieUploadOptions()))
  async uploadFile(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<UploadResponse> {
    if (!file) {
      throw new BadRequestException('Arquivo de poster obrigatorio.');
    }
    const url = await this.mediaStorageService.saveUploadedImage(
      request,
      file,
      'posters',
    );
    return this.responseFactory.upload(url);
  }

  @Get()
  async findAll(
    @Query() paginationQuery: PaginationQueryDto,
  ): Promise<PaginatedResponse<Movie>> {
    const paginatedMovies =
      await this.movieService.getMoviesPage(paginationQuery);
    return this.responseFactory.paginated(paginatedMovies);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Movie> {
    const movie = await this.movieService.getMovieById(id);
    return this.responseFactory.resource(movie);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() movieData: UpdateMovieDto,
  ): Promise<Movie> {
    const updatedMovie = await this.movieService.updateMovie(id, movieData);
    return this.responseFactory.resource(updatedMovie);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.movieService.deleteMovie(id);
  }
}
