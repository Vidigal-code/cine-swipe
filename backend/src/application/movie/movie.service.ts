import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { MOVIE_REPOSITORY } from '../../domain/movie/interfaces/movie.repository';
import type { IMovieRepository } from '../../domain/movie/interfaces/movie.repository';
import { Movie } from '../../domain/movie/entities/movie.entity';
import { PaginationService } from '../../shared/pagination/pagination.service';
import {
  PaginatedResult,
  PaginationQueryInput,
} from '../../shared/pagination/pagination.types';

@Injectable()
export class MovieService {
  constructor(
    @Inject(MOVIE_REPOSITORY)
    private readonly movieRepository: IMovieRepository,
    private readonly paginationService: PaginationService,
  ) {}

  async createMovie(data: Partial<Movie>): Promise<Movie> {
    return this.movieRepository.create(data);
  }

  async getAllMovies(): Promise<Movie[]> {
    return this.movieRepository.findAll();
  }

  async getMoviesPage(
    paginationQuery: PaginationQueryInput,
  ): Promise<PaginatedResult<Movie>> {
    const paginationParams = this.paginationService.resolve(paginationQuery);
    const { items, total } =
      await this.movieRepository.findPage(paginationParams);
    return this.paginationService.buildResult(items, total, paginationParams);
  }

  async getMovieById(id: string): Promise<Movie> {
    const movie = await this.movieRepository.findById(id);
    if (!movie) {
      throw new NotFoundException(`Movie with ID ${id} not found`);
    }
    return movie;
  }

  async updateMovie(id: string, data: Partial<Movie>): Promise<Movie> {
    await this.getMovieById(id);
    return this.movieRepository.update(id, data);
  }

  async deleteMovie(id: string): Promise<void> {
    await this.getMovieById(id);
    await this.movieRepository.delete(id);
  }
}
