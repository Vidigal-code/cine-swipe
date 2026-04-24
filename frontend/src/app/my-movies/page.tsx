'use client';

import { useQuery } from '@tanstack/react-query';
import { Navbar } from '../../widgets/navbar/ui/Navbar';
import { paymentApi } from '../../features/payment/api/payment.api';
import { MovieCard } from '../../entities/movie/ui/MovieCard';
import { useSearchParams } from 'next/navigation';
import { Movie } from '@/entities/movie/model/types';
import { Suspense, useState } from 'react';
import { PaginationControls } from '@/shared/ui/pagination/PaginationControls';

function MyMoviesContent() {
    const searchParams = useSearchParams();
    const showSuccessMessage = searchParams?.get('success');
    const [page, setPage] = useState(1);
    const limit = 8;

    const { data: paginatedMyMovies, isLoading } = useQuery({
        queryKey: ['my-movies', page, limit],
        queryFn: () => paymentApi.getMyMovies({ page, limit }),
        refetchInterval: showSuccessMessage ? 3000 : false, 
    });
    const myMovies = paginatedMyMovies?.data ?? [];
    const paginationMeta = paginatedMyMovies?.meta;

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />
            <main className="flex-grow max-w-7xl mx-auto px-4 w-full py-12">
                <h1 className="text-3xl font-bold mb-8 text-center sm:text-left">Meus Filmes</h1>

                {showSuccessMessage && (
                    <div className="mb-8 p-4 bg-primary/10 border border-primary/40 rounded-lg text-primary">
                        Pagamento em processamento! Seu filme aparecerá aqui assim que o sistema confirmar (pode levar alguns segundos devido à fila de processamento assíncrona).
                    </div>
                )}

                {isLoading ? (
                    <div className="flex justify-center items-center py-20">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        {myMovies.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 justify-items-center">
                                {myMovies.map((movie: Movie) => (
                                    <MovieCard key={movie.id} movie={movie} />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20 text-muted-foreground">
                                Você ainda não comprou filmes ou os pagamentos ainda estão processando.
                            </div>
                        )}
                    </>
                )}

                {paginationMeta && (
                    <PaginationControls
                        meta={paginationMeta}
                        onPageChange={setPage}
                        className="max-w-xl mx-auto"
                    />
                )}
            </main>
        </div>
    );
}

export default function MyMoviesPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-background text-foreground flex items-center justify-center">Carregando...</div>}>
            <MyMoviesContent />
        </Suspense>
    );
}
