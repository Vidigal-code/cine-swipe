export interface Movie {
  id: string;
  title: string;
  synopsis: string;
  genre: string;
  price: number;
  posterUrl: string | null;
  trailerUrl: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface CreateMoviePayload {
  title: string;
  synopsis: string;
  genre: string;
  price: number;
  posterUrl?: string | null;
  trailerUrl?: string | null;
}
