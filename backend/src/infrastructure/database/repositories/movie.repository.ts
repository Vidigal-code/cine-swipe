import { Injectable } from '@nestjs/common';
import { IMovieRepository } from '../../../domain/movie/interfaces/movie.repository';
import { Movie } from '../../../domain/movie/entities/movie.entity';
import { PrismaService } from '../prisma.service';
import { PaginationParams } from '../../../shared/pagination/pagination.types';

const DEFAULT_MOVIE_VALUES = {
  title: '',
  synopsis: '',
  genre: '',
  price: 0,
  posterUrl: null,
  trailerUrl: null,
} as const;

const ORDER_BY_CREATED_DESC = { createdAt: 'desc' } as const;

type PrismaMovieRecord = {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  price: { toNumber: () => number } | number;
  posterUrl: string | null;
  trailerUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export class PrismaMovieRepository implements IMovieRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(movie: Partial<Movie>): Promise<Movie> {
    const createdMovie = await this.prisma.movie.create({
      data: this.buildCreateData(movie),
    });

    return this.toDomain(createdMovie);
  }

  async findAll(): Promise<Movie[]> {
    const movies: PrismaMovieRecord[] = await this.prisma.movie.findMany({
      orderBy: ORDER_BY_CREATED_DESC,
    });
    return this.toDomainList(movies);
  }

  async findPage(
    params: PaginationParams,
  ): Promise<{ items: Movie[]; total: number }> {
    const [movies, total]: [PrismaMovieRecord[], number] =
      await this.prisma.$transaction([
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

  async findById(id: string): Promise<Movie | null> {
    const movie = await this.prisma.movie.findUnique({ where: { id } });
    return movie ? this.toDomain(movie) : null;
  }

  async update(id: string, movie: Partial<Movie>): Promise<Movie> {
    const updatedMovie = await this.prisma.movie.update({
      where: { id },
      data: this.buildUpdateData(movie),
    });

    return this.toDomain(updatedMovie);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.movie.delete({ where: { id } });
  }

  private buildCreateData(movie: Partial<Movie>) {
    return {
      title: movie.title ?? DEFAULT_MOVIE_VALUES.title,
      synopsis: movie.synopsis ?? DEFAULT_MOVIE_VALUES.synopsis,
      genre: movie.genre ?? DEFAULT_MOVIE_VALUES.genre,
      price: movie.price ?? DEFAULT_MOVIE_VALUES.price,
      posterUrl: movie.posterUrl ?? DEFAULT_MOVIE_VALUES.posterUrl,
      trailerUrl: movie.trailerUrl ?? DEFAULT_MOVIE_VALUES.trailerUrl,
    };
  }

  private buildUpdateData(movie: Partial<Movie>) {
    return {
      title: movie.title,
      synopsis: movie.synopsis,
      genre: movie.genre,
      price: movie.price,
      posterUrl: movie.posterUrl,
      trailerUrl: movie.trailerUrl,
    };
  }

  private toDomainList(movies: PrismaMovieRecord[]): Movie[] {
    return movies.map((movie: PrismaMovieRecord) => this.toDomain(movie));
  }

  private toDomain(movie: PrismaMovieRecord): Movie {
    return {
      id: movie.id,
      title: movie.title,
      synopsis: movie.synopsis,
      genre: movie.genre,
      price:
        typeof movie.price === 'number' ? movie.price : movie.price.toNumber(),
      posterUrl: movie.posterUrl,
      trailerUrl: movie.trailerUrl,
      createdAt: movie.createdAt,
      updatedAt: movie.updatedAt,
    };
  }
}
