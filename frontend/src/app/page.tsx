'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Navbar } from '@/widgets/navbar/ui/Navbar';
import { movieApi } from '@/features/movie/api/movie.api';
import { MovieCard } from '@/entities/movie/ui/MovieCard';
import { Movie } from '@/entities/movie/model/types';
import { PaginationControls } from '@/shared/ui/pagination/PaginationControls';

const CATALOG_TEXTS = {
  title: 'Em Cartaz',
  subtitle: 'Os melhores lançamentos, disponíveis para locação e compra instantânea.',
  loadingError: 'Falha ao carregar catálogo. Tente novamente mais tarde.',
  emptyCatalog: 'Nenhum filme disponível no momento.',
};

export default function Home() {
  const [page, setPage] = useState(1);
  const limit = 12;

  const { data: paginatedMovies, isLoading, isError } = useQuery({
    queryKey: ['movies', page, limit],
    queryFn: () => movieApi.getMovies({ page, limit }),
  });
  const movies = paginatedMovies?.data ?? [];
  const paginationMeta = paginatedMovies?.meta;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-orange-400">
            {CATALOG_TEXTS.title}
          </h1>
          <p className="text-foreground/70 max-w-2xl text-lg mx-auto md:mx-0">
            {CATALOG_TEXTS.subtitle}
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        )}

        {isError && (
          <div className="text-center text-red-500 py-10">
            {CATALOG_TEXTS.loadingError}
          </div>
        )}

        {!isLoading && !isError && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
              {movies.map((movie: Movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
            {paginationMeta && (
              <PaginationControls meta={paginationMeta} onPageChange={setPage} />
            )}
          </>
        )}

        {!isLoading && movies.length === 0 && (
          <div className="text-center text-foreground/50 py-20 text-lg">
            {CATALOG_TEXTS.emptyCatalog}
          </div>
        )}
      </main>
    </div>
  );
}
