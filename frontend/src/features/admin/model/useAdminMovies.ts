'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { movieApi } from '@/features/movie/api/movie.api';
import { apiClient } from '@/shared/api/apiClient';
import type {
  CreateMoviePayload,
  PaginationMeta,
} from '@/entities/movie/model/types';

const initialMovieState: CreateMoviePayload = {
  title: '',
  synopsis: '',
  genre: '',
  price: 0,
  trailerUrl: '',
};

interface UseAdminMoviesInput {
  enabled?: boolean;
  page: number;
  limit: number;
}

export function useAdminMovies({
  enabled = true,
  page,
  limit,
}: UseAdminMoviesInput) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [newMovie, setNewMovie] = useState<CreateMoviePayload>(initialMovieState);
  const [file, setFile] = useState<File | null>(null);

  const moviesQuery = useQuery({
    queryKey: ['admin_movies', page, limit],
    queryFn: () => movieApi.getMovies({ page, limit }),
    enabled,
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CreateMoviePayload) => {
      const posterUrl = await uploadPoster(file);
      return movieApi.createMovie(
        normalizeCreateMoviePayload({ ...payload, posterUrl }),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_movies'] });
      setIsCreating(false);
      setFile(null);
      setNewMovie(initialMovieState);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: movieApi.deleteMovie,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin_movies'] });
    },
  });

  return {
    isCreating,
    setIsCreating,
    newMovie,
    setNewMovie,
    setFile,
    moviesQuery,
    movies: moviesQuery.data?.data ?? [],
    paginationMeta: moviesQuery.data?.meta as PaginationMeta | undefined,
    createMutation,
    deleteMutation,
  };
}

async function uploadPoster(file: File | null): Promise<string | null> {
  if (!file) {
    return null;
  }

  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<{ url: string }>('/movies/upload', formData);
  return data.url;
}

function normalizeCreateMoviePayload(
  payload: CreateMoviePayload,
): CreateMoviePayload {
  return {
    ...payload,
    posterUrl: sanitizeUrlField(payload.posterUrl),
    trailerUrl: sanitizeUrlField(payload.trailerUrl),
  };
}

function sanitizeUrlField(value: string | null | undefined): string | null | undefined {
  if (value === undefined || value === null) {
    return value;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
