'use client';
import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../widgets/navbar/ui/Navbar';
import { movieApi } from '../features/movie/api/movie.api';
import { MovieCard } from '../entities/movie/ui/MovieCard';

export default function Home() {
  const { data: movies, isLoading, isError } = useQuery({
    queryKey: ['movies'],
    queryFn: movieApi.getMovies,
  });

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12 text-center md:text-left">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
            Em Cartaz
          </h1>
          <p className="text-gray-400 max-w-2xl text-lg">
            Os melhores lançamentos, disponíveis para locação e compra instantânea.
          </p>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {isError && (
          <div className="text-center text-red-500 py-10">
            Falha ao carregar catálogo. Tente novamente mais tarde.
          </div>
        )}

        {!isLoading && !isError && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {movies?.map((movie: any) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        )}

        {!isLoading && movies?.length === 0 && (
          <div className="text-center text-gray-500 py-20 text-lg">
            Nenhum filme disponível no momento.
          </div>
        )}
      </main>
    </div>
  );
}
