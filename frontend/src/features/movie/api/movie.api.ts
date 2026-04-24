import { apiClient } from '../../../shared/api/apiClient';
import {
  CreateMoviePayload,
  Movie,
  PaginatedResponse,
  PaginationParams,
} from '@/entities/movie/model/types';

export const movieApi = {
  getMovies: async (
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Movie>> => {
    const { data } = await apiClient.get<PaginatedResponse<Movie>>('/movies', {
      params,
    });
    return data;
  },
  getMovieById: async (id: string): Promise<Movie> => {
    const { data } = await apiClient.get<Movie>(`/movies/${id}`);
    return data;
  },
  createMovie: async (payload: CreateMoviePayload): Promise<Movie> => {
    const { data } = await apiClient.post<Movie>('/movies', payload);
    return data;
  },
  deleteMovie: async (id: string): Promise<void> => {
    await apiClient.delete(`/movies/${id}`);
  },
};
