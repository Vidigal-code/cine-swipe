import { Injectable } from '@nestjs/common';
import { IMovieRepository } from '../../../domain/movie/interfaces/movie.repository';
import { Movie } from '../../../domain/movie/entities/movie.entity';
import { PaginationParams } from '../../../shared/pagination/pagination.types';
import { FirebaseStateStoreService } from '../firebase-state-store.service';
import {
  createUuid,
  nowIso,
  paginateDescendingByCreatedAt,
  toDate,
} from '../firebase-state.utils';
import { FirebaseMovieRecord } from '../firebase-state.types';

@Injectable()
export class FirebaseMovieRepository implements IMovieRepository {
  constructor(private readonly stateStore: FirebaseStateStoreService) {}

  async create(movie: Partial<Movie>): Promise<Movie> {
    return this.stateStore.runStateTransaction((state) => {
      const id = movie.id ?? createUuid();
      const createdAt = nowIso();
      const record: FirebaseMovieRecord = {
        id,
        title: movie.title ?? '',
        synopsis: movie.synopsis ?? '',
        genre: movie.genre ?? '',
        price: movie.price ?? 0,
        posterUrl: movie.posterUrl ?? null,
        trailerUrl: movie.trailerUrl ?? null,
        createdAt,
        updatedAt: createdAt,
      };
      state.movies[id] = record;
      return this.toDomain(record);
    });
  }

  async findAll(): Promise<Movie[]> {
    const state = await this.stateStore.readState();
    return Object.values(state.movies)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((movie) => this.toDomain(movie));
  }

  async findPage(
    params: PaginationParams,
  ): Promise<{ items: Movie[]; total: number }> {
    const state = await this.stateStore.readState();
    const paginated = paginateDescendingByCreatedAt(
      Object.values(state.movies),
      params,
    );
    return {
      items: paginated.items.map((item) => this.toDomain(item)),
      total: paginated.total,
    };
  }

  async findById(id: string): Promise<Movie | null> {
    const state = await this.stateStore.readState();
    const movie = state.movies[id];
    return movie ? this.toDomain(movie) : null;
  }

  async update(id: string, movie: Partial<Movie>): Promise<Movie> {
    return this.stateStore.runStateTransaction((state) => {
      const existing = state.movies[id];
      if (!existing) {
        throw new Error('MOVIE_NOT_FOUND');
      }
      const updated: FirebaseMovieRecord = {
        ...existing,
        title: movie.title ?? existing.title,
        synopsis: movie.synopsis ?? existing.synopsis,
        genre: movie.genre ?? existing.genre,
        price: movie.price ?? existing.price,
        posterUrl:
          movie.posterUrl !== undefined ? movie.posterUrl : existing.posterUrl,
        trailerUrl:
          movie.trailerUrl !== undefined
            ? movie.trailerUrl
            : existing.trailerUrl,
        updatedAt: nowIso(),
      };
      state.movies[id] = updated;
      return this.toDomain(updated);
    });
  }

  async delete(id: string): Promise<void> {
    await this.stateStore.runStateTransaction((state) => {
      delete state.movies[id];
      return true;
    });
  }

  private toDomain(record: FirebaseMovieRecord): Movie {
    return {
      id: record.id,
      title: record.title,
      synopsis: record.synopsis,
      genre: record.genre,
      price: record.price,
      posterUrl: record.posterUrl,
      trailerUrl: record.trailerUrl,
      createdAt: toDate(record.createdAt),
      updatedAt: toDate(record.updatedAt),
    };
  }
}
