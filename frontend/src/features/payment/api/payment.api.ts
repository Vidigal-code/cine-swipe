import { apiClient } from '../../../shared/api/apiClient';
import {
  Movie,
  PaginatedResponse,
  PaginationParams,
} from '@/entities/movie/model/types';

interface CheckoutResponse {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

export const paymentApi = {
  checkout: async (movieId: string): Promise<CheckoutResponse> => {
    const { data } = await apiClient.post<CheckoutResponse>('/payments/checkout', {
      movieId,
    });
    return data;
  },
  getMyMovies: async (
    params?: PaginationParams,
  ): Promise<PaginatedResponse<Movie>> => {
    const { data } = await apiClient.get<PaginatedResponse<Movie>>(
      '/payments/my-movies',
      { params },
    );
    return data;
  },
};
